import { cdnRoutes } from './apis/cdn/index.js'
import { telemetryRoutes } from './apis/telemetry/index.js'
import { uploadRoutes } from './apis/upload/index.js'
import { createRouter } from './core/router.js'
import { runScenarios } from './core/scenarios.js'
import { handleOf } from './session.js'
import * as store from './state/store.js'

export {
  CONTENT_MODERATED_PROMPT,
  DERIVATIVE_DISABLED_PUBLIC_KEY,
  DERIVATIVE_INSTANT_PUBLIC_KEY,
  EMULATOR_PORT,
  PROVIDER_UNAVAILABLE_PROMPT
} from './apis/upload/scenarios.js'
export {
  mintAuthToken,
  SIGNED_UPLOADS_SECRET_KEY,
  type MintAuthTokenOptions
} from './apis/upload/auth.js'

export { DEMO_FILES, SESSION_HEADER } from './state/store.js'
export type { StoredFile, StoredImage, TelemetryEvent } from './state/store.js'
export { resetSession, sessionOf } from './session.js'
export type { EmulatorSession, SessionView } from './session.js'
export type { PresetArgs, PresetArgsOf, PresetName } from './presets.js'
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
