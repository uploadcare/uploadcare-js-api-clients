import { http, passthrough } from 'msw'
import type { RequestHandler } from 'msw'
import { answer, createPolicy } from './policy.js'
import type { EmulatorOptions } from './policy.js'

export type { EmulatorOptions } from './policy.js'

const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve))

/**
 * The emulator as MSW request handlers, for a network you set up yourself —
 * typically `msw/vite`'s `virtual:msw` in a dev server:
 *
 * ```ts
 * const { network } = await import('virtual:msw')
 * network.configure({ handlers: emulatorHandlers() })
 * await network.enable()
 * ```
 *
 * Same hosts and `options` as `./browser`; the page's own origin (when there is
 * a page) always passes through. They answer the default session, so
 * `resetSession()` from `.` starts it over.
 */
export const emulatorHandlers = (
  options: EmulatorOptions = {}
): RequestHandler[] => {
  const decide = createPolicy(options, globalThis.location?.origin)
  return [
    http.all('*', async ({ request }) => {
      const decision = decide(request)
      if (decision.kind === 'passthrough') return passthrough()
      if (decision.kind === 'refuse') return Response.error()
      const response = await answer(request)
      if (!response) return Response.error()
      // One macrotask between `send()` and the first upload event. In-page an
      // XHR would otherwise finish within microtasks of `send()`, before a
      // store that flushes on `setTimeout(0)` (file-uploader's
      // `TypedCollection`) has run, and its upload-start/progress events would
      // never be observed. A real network can't answer that fast.
      await nextTask()
      return response
    })
  ]
}
