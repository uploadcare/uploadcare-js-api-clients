// Upload API must register before the CDN: the CDN's route pattern matches a
// uuid in the first path segment, which would also match `/base/` and
// `/info/`. Importing it first here is what keeps upload endpoints from being
// shadowed — don't alphabetise these imports.
import './apis/upload/index.js'
import './apis/cdn/index.js'
import './apis/telemetry/index.js'

export { handle } from './core/router.js'
export { resetSession, sessionOf, SESSION_HEADER } from './state/store.js'
export type {
  Session,
  StoredFile,
  StoredImage,
  TelemetryEvent
} from './state/store.js'
