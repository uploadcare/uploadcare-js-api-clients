/**
 * The AI derivative endpoints: `POST /derivative/image/generate/`, `POST
 * /derivative/image/edit/` and `GET /derivative/status/`.
 *
 * Not in the published Upload API spec, so modelled on the one client that
 * calls them — ai-image-editor's `UploadcareApiClient`
 * (`entities/provider/api/`) and its dev-only Zod schemas. That client posts a
 * JSON body (not a form) and sends `Accept: application/json` rather than
 * `jsonerrors=1`; `apiError` honours the header, and every refusal here carries
 * the snake_case `error_code` the client turns into an `AiProviderError`
 * (without one, it would read the envelope as a job with no `job_id`).
 */
import { jsonRecord } from '../../core/body.js'
import { apiError } from '../../core/responses.js'
import { route, type Route } from '../../core/router.js'
import { protect } from './auth.js'
import { blankPng } from '../../state/blank-png.js'
import {
  type DerivativeJob,
  type Session,
  type StoredFile,
  fileInfo,
  nextUuid,
  sessionOf,
  store
} from '../../state/store.js'

type Body = Record<string, unknown>

const refuse = (
  request: Request,
  status: number,
  errorCode: string,
  content: string
) => apiError(request, status, content, errorCode)

const isRatio = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((side) => Number.isInteger(side) && side > 0)

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

/** The longest side the emulator draws a derivative at. */
const MAX_SIDE = 2048

/**
 * The size a result in `[w, h]` is drawn at: the ratio in lowest terms, scaled
 * up to about 256 px on the long side, so it is exact. A ratio whose lowest
 * terms exceed `MAX_SIDE` is scaled down to fit, to the nearest pixel.
 */
const sizeFor = ([w, h]: [number, number]) => {
  const divisor = gcd(w, h)
  const [width, height] = [w / divisor, h / divisor]
  const long = Math.max(width, height)
  const scale =
    long > MAX_SIDE ? MAX_SIDE / long : Math.max(1, Math.floor(256 / long))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  }
}

/**
 * What a job stores when it succeeds. No model draws anything: a blank PNG at
 * `aspect_ratio`, or with none (an edit on "Auto") the source's own bytes, so
 * the result keeps its dimensions. Either way `/info/`, `-/json/` and an
 * `<img>` all see the same size.
 */
const resultOf = (body: Body, source?: StoredFile) => {
  if (isRatio(body.aspect_ratio)) {
    const { width, height } = sizeFor(body.aspect_ratio)
    return { mimeType: 'image/png', bytes: blankPng(width, height) }
  }
  return { mimeType: source!.mimeType, bytes: source!.bytes }
}

/**
 * What generate and edit share: the body, the fields both require, and the job
 * they start. `validate` is the kind-specific rest, a refusal or nothing.
 */
const startJob = (
  validate: (request: Request, body: Body) => Response | undefined
) =>
  protect(async ({ request }) => {
    const body = await jsonRecord(request)
    if (!body)
      return refuse(request, 400, 'invalid_request', 'Request body is invalid.')

    if (typeof body.prompt !== 'string' || !body.prompt)
      return refuse(request, 400, 'invalid_request', '`prompt` is required.')
    if (typeof body.filename !== 'string')
      return refuse(request, 400, 'invalid_request', '`filename` is required.')
    if (body.aspect_ratio !== undefined && !isRatio(body.aspect_ratio))
      return refuse(
        request,
        400,
        'invalid_aspect_ratio',
        '`aspect_ratio` must be two positive integers.'
      )

    const refusal = validate(request, body)
    if (refusal) return refusal

    const session = sessionOf(request)
    const source =
      typeof body.source === 'string'
        ? session.files.get(body.source)
        : undefined
    const jobId = nextUuid(session)
    session.derivativeJobs.set(jobId, {
      polls: 0,
      name: body.filename,
      isStored: body.store !== false,
      ...resultOf(body, source)
    })
    return Response.json({ type: 'job', job_id: jobId })
  })

/**
 * One frame per poll: `processing`, then `uploading`, then `success` with
 * `is_ready: false` (the file is stored, but — as the real API reports while it
 * is still being ingested — not CDN-ready yet), then `success` with `is_ready:
 * true` for good. The client keeps polling on every frame but an error or a
 * ready success, so this walks it through each. The `derivativesInstant` and
 * `derivativeFailure` presets change the walk.
 */
const frame = (session: Session, job: DerivativeJob) => {
  job.polls += 1
  if (job.polls === 1) return { type: 'job', status: 'processing' }
  if (job.polls === 2) return { type: 'job', status: 'uploading' }
  job.file ??= store(session, {
    name: job.name,
    mimeType: job.mimeType,
    bytes: job.bytes,
    isStored: job.isStored
  })
  return { status: 'success', ...fileInfo(job.file), is_ready: job.polls > 3 }
}

export const derivativeRoutes: Route[] = [
  route(
    'POST',
    '/derivative/image/generate/',
    startJob((request, body) =>
      body.aspect_ratio === undefined
        ? refuse(request, 400, 'invalid_request', '`aspect_ratio` is required.')
        : undefined
    )
  ),
  route(
    'POST',
    '/derivative/image/edit/',
    startJob((request, body) => {
      if (typeof body.source !== 'string' || !body.source)
        return refuse(request, 400, 'invalid_request', '`source` is required.')
      const source = sessionOf(request).files.get(body.source)
      if (!source)
        return refuse(
          request,
          404,
          'source_not_found',
          'Source file is not found.'
        )
      if (!source.image)
        return refuse(
          request,
          400,
          'source_not_image',
          'Source file is not an image.'
        )
      return undefined
    })
  ),
  route(
    'GET',
    '/derivative/status/',
    protect(({ request }) => {
      const session = sessionOf(request)
      const jobId = new URL(request.url).searchParams.get('job_id')
      if (!jobId)
        return refuse(request, 400, 'job_id_required', 'job_id is required.')
      const job = session.derivativeJobs.get(jobId)
      if (!job)
        return refuse(
          request,
          404,
          'job_not_found',
          'Derivative job is not found.'
        )
      return Response.json(frame(session, job))
    })
  )
]
