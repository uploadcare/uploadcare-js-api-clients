import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest'
import { http, passthrough } from 'msw'
import { setupWorker } from 'msw/browser'
import { handle, resetSession } from './index.js'
import type { SessionView } from './index.js'

/**
 * The hosts the emulator answers for: the Upload API, the CDN (`ucarecdn.com`
 * and the per-project `<prefix>.ucarecd.net`) and the telemetry sink — see
 * `apis/`. `handle` routes by path alone, so the host check lives here.
 */
const UPLOADCARE_HOSTS = [
  'upload.uploadcare.com',
  'tlm.uploadcare.com',
  'ucarecdn.com',
  'ucarecd.net'
]
const PREFIXED_CDN = /\.ucarecd\.net$/
/** Any other Uploadcare host is refused even under `unhandled: 'passthrough'`. */
const UPLOADCARE_DOMAIN = /(^|\.)(uploadcare\.com|ucarecdn\.com|ucarecd\.net)$/

export type EmulatorOptions = {
  /**
   * Extra CDN hostnames to emulate, for a project's custom cname
   * (`['cdn.example.com']`). Hostnames, not URLs.
   */
  cdnHosts?: readonly string[]
  /**
   * What to do with a request to any other origin than the page's own (which
   * always passes through: that's the dev server).
   *
   * - `'error'` (default): fail it as a network error and `console.error` its
   *   URL, so a new or mistyped endpoint can't quietly reach a real service.
   * - `'passthrough'`: let it go out to the network, unless it's an Uploadcare
   *   host the emulator doesn't answer (`api.uploadcare.com`, …): that is still
   *   refused.
   */
  unhandled?: 'error' | 'passthrough'
}

export type BrowserEmulator = {
  /**
   * Starts answering the page's requests (once; later calls reuse it) and
   * resets the default session. Call it before every test.
   */
  reset(): Promise<SessionView>
  /** Stops answering; a later `reset()` starts again. */
  stop(): Promise<void>
}

type Decision =
  | { kind: 'emulate' }
  | { kind: 'passthrough' }
  | { kind: 'refuse'; error: TypeError }

/** `undefined` for a route the emulator doesn't have, named in the console. */
const answer = async (request: Request) => {
  const response = await handle(request)
  if (!response) {
    console.warn(
      `@uploadcare/api-emulator does not implement ${request.method} ${request.url}`
    )
  }
  return response
}

const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve))

/**
 * The Uploadcare emulator, running in the page. Two ways in, one state:
 *
 * - `XMLHttpRequestInterceptor` answers XHR (every upload) in the page, so
 *   `xhr.upload` progress fires per body chunk
 *   (https://mswjs.io/docs/recipes/xmlhttprequest-progress-events/);
 * - An MSW Service Worker answers `fetch` and resource loads (`<img>`), which no
 *   in-page hook can reach.
 *
 * One per page: two would register two workers against the same script.
 */
export const setupEmulator = ({
  cdnHosts = [],
  unhandled = 'error'
}: EmulatorOptions = {}): BrowserEmulator => {
  for (const host of cdnHosts) {
    if (!/^[a-z0-9.-]+$/i.test(host)) {
      throw new TypeError(`cdnHosts takes hostnames, got ${host}`)
    }
  }
  const emulated = new Set(
    [...UPLOADCARE_HOSTS, ...cdnHosts].map((host) => host.toLowerCase())
  )

  const decide = (request: Request): Decision => {
    const url = new URL(request.url)
    if (emulated.has(url.hostname) || PREFIXED_CDN.test(url.hostname)) {
      return { kind: 'emulate' }
    }
    if (url.origin === location.origin) return { kind: 'passthrough' }
    const uploadcare = UPLOADCARE_DOMAIN.test(url.hostname)
    if (!uploadcare && unhandled === 'passthrough') {
      return { kind: 'passthrough' }
    }
    const message = uploadcare
      ? `@uploadcare/api-emulator does not emulate ${request.method} ${request.url}`
      : `@uploadcare/api-emulator: ${request.method} ${request.url} is neither Uploadcare nor this page's origin`
    console.error(message)
    return { kind: 'refuse', error: new TypeError(message) }
  }

  const start = async () => {
    const worker = setupWorker(
      http.all('*', async ({ request }) => {
        const decision = decide(request)
        if (decision.kind === 'passthrough') return passthrough()
        if (decision.kind === 'refuse') return Response.error()
        return (await answer(request)) ?? Response.error()
      })
    )
    // `http.all('*')` handles every request, so `onUnhandledRequest` never
    // fires. The worker script is `/mockServiceWorker.js`: @vitest/browser
    // serves it from msw itself; anywhere else, `npx msw init <publicDir>`.
    await worker.start({ quiet: true })

    // Only after the worker is up, so a failed start leaves nothing applied.
    const xhr = new XMLHttpRequestInterceptor()
    xhr.on('request', async ({ request, controller }) => {
      const decision = decide(request)
      if (decision.kind === 'passthrough') return
      if (decision.kind === 'refuse')
        return controller.errorWith(decision.error)
      const response = await answer(request)
      if (!response || response.type === 'error') {
        return controller.errorWith(new TypeError('Failed to fetch'))
      }
      // One macrotask between `send()` and the first upload event. In-page the
      // whole XHR would otherwise finish within microtasks of `send()`, before
      // a store that flushes on `setTimeout(0)` (file-uploader's
      // `TypedCollection`) has run, and its upload-start/progress events
      // would never be observed. A real network can't answer that fast.
      // `fetch` has no upload events, so the worker path needs no hold.
      await nextTask()
      controller.respondWith(response)
    })
    xhr.apply()
    return () => {
      xhr.dispose()
      worker.stop()
    }
  }

  let started: ReturnType<typeof start> | undefined

  return {
    async reset() {
      started ??= start()
      await started
      return resetSession()
    },
    async stop() {
      const stopping = started
      started = undefined
      ;(await stopping)?.()
    }
  }
}
