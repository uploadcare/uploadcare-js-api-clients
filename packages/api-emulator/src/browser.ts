import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest'
import { http, passthrough } from 'msw'
import { setupWorker } from 'msw/browser'
import { resetSession } from './index.js'
import { answer, createPolicy } from './policy.js'
import type { Emulator, EmulatorOptions } from './policy.js'

export type { EmulatorOptions } from './policy.js'
/** `./browser`'s name for {@link Emulator}. */
export type BrowserEmulator = Emulator

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
export const setupEmulator = (
  options: EmulatorOptions = {}
): BrowserEmulator => {
  const decide = createPolicy(options, location.origin)

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
      if (!response) {
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
