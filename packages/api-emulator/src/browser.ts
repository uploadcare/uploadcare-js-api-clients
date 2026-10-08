import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest'
import { createDefaultNetworkOptions } from 'msw/browser'
import { InterceptorSource, defineNetwork } from 'msw/experimental'
import { resetSession } from './index.js'
import { emulatorHandlers } from './msw.js'
import type { Emulator, EmulatorOptions } from './policy.js'

export type BrowserEmulatorOptions = EmulatorOptions & {
  /**
   * Where the MSW worker script is served (`npx msw init <publicDir>`, or
   * `msw/vite`'s plugin). Set it for an app under a non-root `base`.
   *
   * @default '/mockServiceWorker.js'
   */
  workerUrl?: string
}
/** `./browser`'s name for {@link Emulator}. */
export type BrowserEmulator = Emulator

/**
 * The Uploadcare emulator, running in the page: one MSW network, one handler
 * (`emulatorHandlers` from `./msw`), two ways in:
 *
 * - `XMLHttpRequestInterceptor` answers XHR (every upload) in the page, so
 *   `xhr.upload` progress fires per body chunk
 *   (https://mswjs.io/docs/recipes/xmlhttprequest-progress-events/). It comes
 *   first: a Service Worker would see the XHR only after its body was sent;
 * - MSW's default browser sources (a Service Worker) answer `fetch` and resource
 *   loads (`<img>`), which no in-page hook can reach.
 *
 * One per page: two would register two workers against the same script.
 */
export const setupEmulator = ({
  workerUrl,
  ...options
}: BrowserEmulatorOptions = {}): BrowserEmulator => {
  const handlers = emulatorHandlers(options)

  const start = async () => {
    const xhr = new InterceptorSource({
      interceptors: [new XMLHttpRequestInterceptor()]
    })
    const { sources } = createDefaultNetworkOptions(workerUrl)
    const network = defineNetwork({
      sources: [xhr, ...sources],
      handlers,
      // The handler takes every HTTP request; this is for WebSockets (the dev
      // server's own), which the emulator leaves alone.
      onUnhandledFrame: 'bypass',
      context: { quiet: true }
    })
    try {
      await network.enable()
    } catch (error) {
      // The worker failed. `network.disable()` would wait on it forever, so
      // undo the in-page patches (every interceptor source) directly.
      for (const source of [xhr, ...sources]) {
        if (source instanceof InterceptorSource) source.disable()
      }
      throw error
    }
    return () => network.disable()
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
      await (
        await stopping
      )?.()
    }
  }
}
