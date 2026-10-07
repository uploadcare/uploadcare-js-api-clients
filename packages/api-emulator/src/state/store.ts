/**
 * What the fake Uploadcare keeps: the files uploaded to it, the groups built
 * from them, and the `from_url` and derivative jobs still being polled.
 *
 * All of it is per session, and a session is one test file's page. The suite
 * runs its files in parallel against one fake, so a single shared store would
 * mean one file's upload being answered with another's — and clearing it
 * between tests would drop a file that a test still running elsewhere was about
 * to ask about.
 */

import { imageSize } from './image-size.js'
import { STOCK_IMAGE } from './stock-image.js'

export type StoredImage = { width: number; height: number; format: string }

export type StoredFile = {
  uuid: string
  /** As the client sent it. The API reports this as `original_filename`. */
  name: string
  size: number
  mimeType: string
  bytes: Uint8Array
  image?: StoredImage
  isStored: boolean
}

/**
 * A `/from_url/` job in flight. `uuid` names the stored file this job's poll
 * answers with — empty for a source whose host isn't in `REACHABLE_HOSTS`, so
 * the poll route can tell "still fetching" apart from "never going to exist" by
 * whether that lookup finds a file, without a field of its own. `computable`
 * mirrors whether the request used `UNKNOWN_PROGRESS_KEY`: `false` reports
 * `total: 'unknown'` on every progress poll instead of a byte count.
 * `total`/`done` track the simulated transfer.
 */
export type FromUrlJob = {
  uuid: string
  polls: number
  computable: boolean
  total: number
  done: number
}

/**
 * A `/multipart/start/` session in flight, keyed by its own `uuid` — the same
 * one `/multipart/complete/` assembles into a stored file and `/info/` then
 * answers about. `parts` is pre-sized to the part count `/multipart/start/`
 * handed out (see `multipart.ts`'s `MULTIPART_CHUNK_SIZE`); each part `PUT`
 * fills in its own index, `undefined` until then. `isStored` carries the
 * `UPLOADCARE_STORE` field from `/multipart/start/` through to
 * `/multipart/complete/` — `multipartComplete.ts` (upload-client) never resends
 * it, so the only place to learn it is here.
 */
export type MultipartUpload = {
  uuid: string
  name: string
  size: number
  mimeType: string
  isStored: boolean
  parts: (Uint8Array | undefined)[]
}

/**
 * A derivative (AI generate/edit) job in flight, keyed by the `job_id` the POST
 * handed out. `polls` drives the status sequence (see `derivative.ts`);
 * `failure` is the scenario error the job ends in instead of a file (see
 * `scenarios.ts`); `file` is the stored result, set by the first poll that
 * reports `success`.
 */
export type DerivativeJob = {
  polls: number
  name: string
  isStored: boolean
  /** Terminal on the first poll — see `DERIVATIVE_INSTANT_PUBLIC_KEY`. */
  instant: boolean
  failure?: { code: string; message: string }
  file?: StoredFile
}

/**
 * Files the tests address by uuid without uploading them first — they exist in
 * the demo project, so a fresh session starts with them already stored.
 *
 * - `49b4c5a1-31b3-4349-ba07-d97a2d883c37` — `upload-client`'s
 *   `test/_fixtureFactory.ts` (`uuid('image')`/`uuid('token')`), polled by
 *   `uploadFromUploaded.test.ts`, `api/info.test.ts` and `uploadFile.test.ts`.
 *   The real API has this file; nothing in the suite uploads it first.
 * - `7124ae98-344c-42b2-ae2a-bd9aa79d76d8` — the browser suite's
 *   `adaptive-image.e2e.test.tsx` (`<uc-img>`).
 * - `f4dc9ebc-ed6d-4b4d-83d1-863bf1e4bb7f` — the browser suite's
 *   `cloud-image-editor.e2e.test.tsx` / `editor-filters.e2e.test.tsx` /
 *   `telemetry/editor-and-sources.e2e.test.tsx` (`<uc-cloud-image-editor>`).
 * - `90e06e59-8055-4435-9291-c005a98cf098` — the browser suite's
 *   `solutions/bundles.e2e.test.tsx` (both `<uc-cloud-image-editor>` and
 *   `<uc-img>`).
 *
 * Mirrors `blocks:tests/utils/fake-uploadcare/files.ts`'s `DEMO_FILES`, plus
 * the one uuid `upload-client` alone still needs.
 */
export const DEMO_FILES = [
  '49b4c5a1-31b3-4349-ba07-d97a2d883c37',
  '7124ae98-344c-42b2-ae2a-bd9aa79d76d8',
  'f4dc9ebc-ed6d-4b4d-83d1-863bf1e4bb7f',
  '90e06e59-8055-4435-9291-c005a98cf098'
]

/**
 * A telemetry event body, exactly as `POST /api/v1/events` received it.
 * Deliberately untyped beyond "some JSON object": telemetry is fire-and-forget
 * from the uploader's side, there's no spec to validate it against (see
 * `apis/telemetry/index.ts`), and a strict shape here would fail a test over
 * the emulator's opinion of the payload rather than anything the uploader
 * actually got wrong.
 */
export type TelemetryEvent = Record<string, unknown>

/** A `files[]` member, parsed once when its group is created. */
export type GroupMember = { uuid: string; effects: string }

export type Session = {
  files: Map<string, StoredFile>
  groups: Map<string, GroupMember[]>
  fromUrlJobs: Map<string, FromUrlJob>
  /**
   * Source url → the uuid it was last stored as, for `check_URL_duplicates`.
   * Only written when `save_URL_duplicates` asked for it, which is what the
   * real API keys its dedup index on.
   */
  fromUrlSources: Map<string, string>
  multipart: Map<string, MultipartUpload>
  derivativeJobs: Map<string, DerivativeJob>
  issued: number
  /** `/throttle/`'s per-session request count — see throttle.ts. */
  throttled: number
  /** Every `POST /api/v1/events` body received, in arrival order. */
  telemetry: TelemetryEvent[]
  /** `THROTTLE_ONCE_FIELD` values already throttled — see auth.ts. */
  throttledOnce: Set<string>
  /** Operations spent per bearer token, for `limits.operations` — see auth.ts. */
  tokenOperations: Map<string, number>
}

/** Names the session on every redirected request; set by the caller. */
export const SESSION_HEADER = 'x-uploadcare-emulator-session'

const sessions = new Map<string, Session>()

/**
 * Empties a session, or starts one: a freshly reset session holds no files
 * beyond the demo project's own (`DEMO_FILES`, above).
 */
export const resetSession = (id = 'default') => {
  const session: Session = {
    files: new Map(),
    groups: new Map(),
    fromUrlJobs: new Map(),
    fromUrlSources: new Map(),
    multipart: new Map(),
    derivativeJobs: new Map(),
    issued: 0,
    throttled: 0,
    telemetry: [],
    throttledOnce: new Set(),
    tokenOperations: new Map()
  }
  for (const uuid of DEMO_FILES)
    storeStockImage(session, 'demo.jpg', true, uuid)
  sessions.set(id, session)
  return session
}

/**
 * The session a request belongs to. An unknown one is started rather than
 * refused: it has simply uploaded nothing.
 */
export const sessionOf = (request: Request) => {
  const id = request.headers.get(SESSION_HEADER) ?? 'default'
  return sessions.get(id) ?? resetSession(id)
}

/**
 * Ids count up within a session instead of being random, so that a failing run
 * names the same file every time and a uuid in a DOM assertion or a log line
 * can be traced back to the upload that made it.
 */
export const nextUuid = (session: Session) =>
  `${(++session.issued).toString(16).padStart(8, '0')}-0000-4000-8000-000000000000`

/** Keeps `file` under `uuid` (a fresh one by default), sized from its bytes. */
export const store = (
  session: Session,
  file: Omit<StoredFile, 'uuid' | 'size' | 'image'>,
  uuid = nextUuid(session)
): StoredFile => {
  const stored = {
    ...file,
    uuid,
    size: file.bytes.byteLength,
    image: imageSize(file.bytes)
  }
  session.files.set(uuid, stored)
  return stored
}

/**
 * The real API strips everything but word characters, dots and dashes; tests
 * assert on both spellings.
 */
const sanitize = (name: string) => name.replace(/[^\w.-]/g, '')

export const imageInfo = (file: StoredFile) =>
  file.image && {
    dpi: [72, 72],
    width: file.image.width,
    format: file.image.format,
    height: file.image.height,
    sequence: false,
    color_mode: 'RGB',
    orientation: null,
    geo_location: null,
    datetime_original: null
  }

/** The `/info/` payload, which is also what `from_url` and `/group/` embed. */
export const fileInfo = (file: StoredFile) => {
  const image = imageInfo(file)
  const [type, subtype] = file.mimeType.split('/')
  return {
    size: file.size,
    total: file.size,
    done: file.size,
    uuid: file.uuid,
    file_id: file.uuid,
    original_filename: file.name,
    is_image: Boolean(file.image),
    is_stored: file.isStored,
    image_info: image ?? null,
    video_info: null,
    content_info: {
      mime: { mime: file.mimeType, type, subtype },
      ...(image ? { image } : {})
    },
    is_ready: true,
    filename: sanitize(file.name),
    mime_type: file.mimeType,
    metadata: {}
  }
}

/**
 * A stand-in for a file the emulator never really gets — a `from_url` source
 * nothing ever fetches, a derivative no model ever draws — so each resolves to
 * the same bytes as every demo-project file, under the name the request asked
 * for rather than one implied by the bytes. These have to be the _shared_
 * `STOCK_IMAGE` (a real, decodable JPEG), not a hand-written header: the CDN
 * serves them back as `image/jpeg`, and an `<img>` in a browser consumer fires
 * `error` rather than `load` on anything a decoder can't read.
 */
export const storeStockImage = (
  session: Session,
  name: string,
  isStored: boolean,
  uuid?: string
) =>
  store(
    session,
    { name, mimeType: 'image/jpeg', bytes: STOCK_IMAGE, isStored },
    uuid
  )
