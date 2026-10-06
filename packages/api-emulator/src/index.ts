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
export { resetSession, sessionOf, SESSION_HEADER } from './state/store.js'
export type {
  Session,
  StoredFile,
  StoredImage,
  TelemetryEvent
} from './state/store.js'
