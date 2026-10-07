import { cdnRoutes } from './apis/cdn/index.js'
import { telemetryRoutes } from './apis/telemetry/index.js'
import { uploadRoutes } from './apis/upload/index.js'
import { createRouter } from './core/router.js'

export {
  CONTENT_MODERATED_PROMPT,
  DERIVATIVE_DISABLED_PUBLIC_KEY,
  DERIVATIVE_INSTANT_PUBLIC_KEY,
  PROVIDER_UNAVAILABLE_PROMPT,
  SIGNED_UPLOADS_PUBLIC_KEY,
  SIGNED_UPLOADS_SECRET_KEY
} from './apis/upload/scenarios.js'
import * as store from './state/store.js'
import type { StoredFile, TelemetryEvent } from './state/store.js'

export { SESSION_HEADER } from './state/store.js'
export type { StoredFile, StoredImage, TelemetryEvent } from './state/store.js'

/**
 * What a test may read back from a session. The store's own layout (jobs,
 * counters, the uuid sequence) stays internal, so changing it isn't a breaking
 * change.
 */
export type SessionView = {
  readonly files: ReadonlyMap<string, StoredFile>
  readonly telemetry: readonly TelemetryEvent[]
}

// The CDN's `/:uuid/*` matches nearly any path, so it goes last.
export const handle = createRouter([
  ...uploadRoutes,
  ...telemetryRoutes,
  ...cdnRoutes
])

export const resetSession: (id?: string) => SessionView = store.resetSession
export const sessionOf: (request: Request) => SessionView = store.sessionOf
