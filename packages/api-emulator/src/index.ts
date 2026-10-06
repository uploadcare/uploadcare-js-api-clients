// Each import registers its routes as a side effect. Order is only a tiebreak:
// a route that answers `undefined` (the CDN for a non-uuid path) passes the
// request on to the next match.
import './apis/upload/index.js'
import './apis/cdn/index.js'
import './apis/telemetry/index.js'

export { handle } from './core/router.js'
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

export const resetSession: (id?: string) => SessionView = store.resetSession
export const sessionOf: (request: Request) => SessionView = store.sessionOf
