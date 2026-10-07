import { cdnRoutes } from './apis/cdn/index.js'
import { telemetryRoutes } from './apis/telemetry/index.js'
import { uploadRoutes } from './apis/upload/index.js'
import { createRouter } from './core/router.js'
import { runScenarios } from './core/scenarios.js'
import { handleOf } from './session.js'
import * as store from './state/store.js'

export {
  mintAuthToken,
  SIGNED_UPLOADS_SECRET_KEY,
  type MintAuthTokenOptions
} from './apis/upload/auth.js'

export { DEMO_FILES, SESSION_HEADER } from './state/store.js'
export type { StoredFile, StoredImage, TelemetryEvent } from './state/store.js'
export { resetSession, sessionOf } from './session.js'
export type { EmulatorSession, SessionView } from './session.js'
export type {
  DerivativeFailureCode,
  PresetArgs,
  PresetArgsOf,
  PresetName
} from './presets.js'
export type {
  ScenarioContext,
  ScenarioHandler,
  ScenarioMatch,
  ScenarioOptions
} from './core/scenarios.js'

// The CDN's `/:uuid/*` matches nearly any path, so it goes last.
const routes = createRouter([...uploadRoutes, ...telemetryRoutes, ...cdnRoutes])

/**
 * The emulator's answer to `request`: its session's scenarios first, then the
 * routes. `undefined` for a request nothing handles.
 */
export const handle = (request: Request): Promise<Response | undefined> => {
  const session = store.sessionOf(request)
  return runScenarios(session.scenarios, handleOf(session), request, routes)
}

export type CreateFetchOptions = {
  /**
   * Sent as `SESSION_HEADER` on every request; the `'default'` session
   * otherwise.
   */
  session?: string
}

/**
 * A `fetch` the emulator answers, in-process, for code that takes an injectable
 * one. Like `fetch`, it rejects with the signal's reason when the signal is
 * already aborted, and with a `TypeError` on a network error: a request no
 * route answers, or a dropped connection (`Response.error()`).
 */
export const createFetch =
  ({ session }: CreateFetchOptions = {}) =>
  async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init)
    request.signal.throwIfAborted()
    if (session !== undefined)
      request.headers.set(store.SESSION_HEADER, session)
    const response = await handle(request)
    if (!response)
      throw new TypeError(
        `@uploadcare/api-emulator does not implement ${request.method} ${request.url}`
      )
    if (response.type === 'error')
      throw new TypeError(
        `@uploadcare/api-emulator dropped ${request.method} ${request.url}`
      )
    return response
  }
