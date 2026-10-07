import { ClientRequestInterceptor } from '@mswjs/interceptors/ClientRequest'
import { FetchInterceptor } from '@mswjs/interceptors/fetch'
import { resetSession } from './index.js'
import { answer, createPolicy } from './policy.js'
import type { Emulator, EmulatorOptions } from './policy.js'

export type { EmulatorOptions } from './policy.js'
/** `./node`'s name for {@link Emulator}. */
export type NodeEmulator = Emulator

/**
 * The Uploadcare emulator, in this Node process. Two ways in, one state:
 *
 * - `FetchInterceptor` answers the global `fetch`;
 * - `ClientRequestInterceptor` answers `node:http`/`node:https`, which is how
 *   `@uploadcare/upload-client` sends in Node. It patches the module objects,
 *   so a client must call `http.request` (or `get`), not a named import bound
 *   before `reset()`.
 *
 * A DOM test environment (happy-dom, jsdom) swaps the global `fetch` for its
 * own, which goes out over `node:http(s)` and enforces CORS like a browser: it
 * preflights a cross-origin request and checks the answer's
 * `access-control-allow-origin`. So, like `./listen`, this answers `OPTIONS`
 * itself (`handle()` has no `OPTIONS` route) and lets every origin read the
 * emulator's answers.
 *
 * One per process: both patch globals.
 */
export const setupEmulator = (options: EmulatorOptions = {}): NodeEmulator => {
  const decide = createPolicy(options)

  const start = () => {
    const interceptors = [
      new FetchInterceptor(),
      new ClientRequestInterceptor()
    ]
    for (const interceptor of interceptors) {
      interceptor.on('request', async ({ request, controller }) => {
        const decision = decide(request)
        if (decision.kind === 'passthrough') return
        if (decision.kind === 'refuse')
          return controller.errorWith(decision.error)
        if (request.method === 'OPTIONS') {
          return controller.respondWith(
            new Response(null, {
              status: 204,
              headers: {
                'access-control-allow-origin': '*',
                'access-control-allow-methods':
                  'GET, POST, PUT, DELETE, HEAD, OPTIONS',
                'access-control-allow-headers':
                  request.headers.get('access-control-request-headers') ?? '*',
                'access-control-max-age': '86400'
              }
            })
          )
        }
        const response = await answer(request)
        if (!response)
          return controller.errorWith(new TypeError('Failed to fetch'))
        const headers = new Headers(response.headers)
        headers.set('access-control-allow-origin', '*')
        headers.set('access-control-expose-headers', '*')
        controller.respondWith(
          new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
          })
        )
      })
      interceptor.apply()
    }
    return () => {
      for (const interceptor of interceptors) interceptor.dispose()
    }
  }

  let stopping: (() => void) | undefined

  return {
    async reset() {
      stopping ??= start()
      return resetSession()
    },
    async stop() {
      stopping?.()
      stopping = undefined
    }
  }
}
