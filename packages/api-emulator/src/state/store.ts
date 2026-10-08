/**
 * What the fake Uploadcare keeps: the files uploaded to it, the groups built
 * from them, and the `from_url` and derivative jobs still being polled.
 *
 * All of it is per session, named by a request's `SESSION_HEADER` (the
 * `'default'` session without one). A suite that runs its files in parallel
 * against one shared emulator, a single `./listen` server say, sets a header
 * per file: with one store, one file's upload could be answered with another's,
 * and a reset between tests would drop a file that a test still running
 * elsewhere was about to ask about.
 */

import type { Scenario } from '../core/scenarios.js'
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
  /**
   * The project it belongs to, set by the `storedFile` preset: another
   * project's `/info/` and `/group/` can't find it. Every project's when
   * absent.
   */
  publicKey?: string
}

/**
 * A `/from_url/` job in flight: `uuid` is absent for a host it can't fetch
 * from, `done` counts bytes so far.
 */
export type FromUrlJob = {
  uuid?: string
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
  mimeType: string
  isStored: boolean
  parts: (Uint8Array | undefined)[]
}

/**
 * A derivative (AI generate/edit) job in flight, keyed by the `job_id` the POST
 * handed out. `polls` drives the status sequence (see `derivative.ts`); `file`
 * is the stored result, set by the first poll that reports `success`, from
 * `mimeType` and `bytes`.
 */
export type DerivativeJob = {
  polls: number
  name: string
  isStored: boolean
  mimeType: string
  bytes: Uint8Array
  file?: StoredFile
}

/**
 * Files the tests address by uuid without uploading them first — they exist in
 * the demo project, so a fresh session starts with them already stored. Each is
 * the stock image (`STOCK_IMAGE`: a 136×150 JPEG, stored, named `demo.jpg`);
 * the uuids differ only because each consumer hardcoded the one its real-API
 * run used. Import the name rather than repeating the uuid.
 */

/**
 * `upload-client`'s `test/_fixtureFactory.ts`
 * (`uuid('image')`/`uuid('token')`), polled by `uploadFromUploaded.test.ts`,
 * `api/info.test.ts` and `uploadFile.test.ts`. The real API has this file;
 * nothing in the suite uploads it first.
 */
export const DEMO_IMAGE_UUID = '49b4c5a1-31b3-4349-ba07-d97a2d883c37'
/** The browser suite's `adaptive-image.e2e.test.tsx` (`<uc-img>`). */
export const ADAPTIVE_IMAGE_UUID = '7124ae98-344c-42b2-ae2a-bd9aa79d76d8'
/**
 * The browser suite's `cloud-image-editor.e2e.test.tsx` /
 * `editor-filters.e2e.test.tsx` / `telemetry/editor-and-sources.e2e.test.tsx`
 * (`<uc-cloud-image-editor>`).
 */
export const EDITOR_IMAGE_UUID = 'f4dc9ebc-ed6d-4b4d-83d1-863bf1e4bb7f'
/**
 * The browser suite's `solutions/bundles.e2e.test.tsx` (both
 * `<uc-cloud-image-editor>` and `<uc-img>`).
 */
export const BUNDLE_IMAGE_UUID = '90e06e59-8055-4435-9291-c005a98cf098'

/** Every seeded demo file, the named uuids above. */
export const DEMO_FILES: readonly string[] = [
  DEMO_IMAGE_UUID,
  ADAPTIVE_IMAGE_UUID,
  EDITOR_IMAGE_UUID,
  BUNDLE_IMAGE_UUID
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
  /** Every `POST /api/v1/events` body received, in arrival order. */
  telemetry: TelemetryEvent[]
  /** A clone of every request `handle()` received, in arrival order. */
  requests: Request[]
  /** Operations spent per bearer token, for `limits.operations` — see auth.ts. */
  tokenOperations: Map<string, number>
  /** `session.on()`'s, in registration order — see core/scenarios.ts. */
  scenarios: Scenario[]
  /** Projects a preset named, on top of the demo account's — see auth.ts. */
  publicKeys: Set<string>
  /** The `signedUploads` preset: for these projects, or `true` for all. */
  signedUploads: true | Set<string>
}

/** Names the session on every redirected request; set by the caller. */
export const SESSION_HEADER = 'x-uploadcare-emulator-session'

const sessions = new Map<string, Session>()

/**
 * Empties a session, or starts one: a freshly reset session holds no files
 * beyond the demo project's own (`DEMO_FILES`, above). A session is emptied in
 * place, so a handle taken before the reset keeps steering it.
 */
export const resetSession = (id = 'default') => {
  const fresh: Session = {
    files: new Map(),
    groups: new Map(),
    fromUrlJobs: new Map(),
    fromUrlSources: new Map(),
    multipart: new Map(),
    derivativeJobs: new Map(),
    issued: 0,
    telemetry: [],
    requests: [],
    tokenOperations: new Map(),
    scenarios: [],
    publicKeys: new Set(),
    signedUploads: new Set()
  }
  for (const uuid of DEMO_FILES) storeStockImage(fresh, 'demo.jpg', true, uuid)
  const existing = sessions.get(id)
  if (existing) return Object.assign(existing, fresh)
  sessions.set(id, fresh)
  return fresh
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
 * `uuid`'s file as `publicKey`'s project sees it; `null` (a Bearer token stood
 * in for the key) sees every file.
 */
export const fileOf = (
  session: Session,
  uuid: string,
  publicKey: string | null
) => {
  const file = session.files.get(uuid)
  return file?.publicKey === undefined ||
    publicKey === null ||
    file.publicKey === publicKey
    ? file
    : undefined
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
