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
import { isRecord } from '../../core/body.js'
import { apiError } from '../../core/responses.js'
import { route } from '../../core/router.js'
import {
  type DerivativeJob,
  type Session,
  fileInfo,
  nextUuid,
  sessionOf,
  storeStockImage
} from '../../state/store.js'
import {
  DERIVATIVE_DISABLED_PUBLIC_KEY,
  DERIVATIVE_FAILURES
} from './scenarios.js'

type Body = Record<string, unknown>

const refuse = (
  request: Request,
  status: number,
  errorCode: string,
  content: string
) => apiError(request, status, content, errorCode)

const isRatio = (value: unknown) =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((side) => Number.isInteger(side) && side > 0)

const readBody = async (request: Request): Promise<Body | undefined> => {
  const body: unknown = await request.json().catch(() => undefined)
  return isRecord(body) ? body : undefined
}

/**
 * What generate and edit share: the body, the project check, the fields both
 * require, and the job they start. `validate` is the kind-specific rest, a
 * refusal or nothing.
 */
const startJob =
  (
    kind: 'generate' | 'edit',
    validate: (request: Request, body: Body) => Response | undefined
  ) =>
  async ({ request }: { request: Request }) => {
    const body = await readBody(request)
    if (!body)
      return refuse(request, 400, 'invalid_request', 'Request body is invalid.')

    // The gate has already accepted the key; this one is a project without
    // derivatives, refused before any validation.
    const publicKey =
      body.pub_key ?? new URL(request.url).searchParams.get('pub_key')
    if (publicKey === DERIVATIVE_DISABLED_PUBLIC_KEY)
      return refuse(
        request,
        403,
        'derivative_disabled',
        'Derivatives are not enabled for this project.'
      )

    if (typeof body.prompt !== 'string' || !body.prompt)
      return refuse(request, 400, 'invalid_request', '`prompt` is required.')
    if (typeof body.filename !== 'string')
      return refuse(request, 400, 'invalid_request', '`filename` is required.')
    if (kind === 'generate' && body.aspect_ratio === undefined)
      return refuse(
        request,
        400,
        'invalid_request',
        '`aspect_ratio` is required.'
      )
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
    const jobId = nextUuid(session)
    session.derivativeJobs.set(jobId, {
      polls: 0,
      name: body.filename,
      isStored: body.store !== false,
      failure: DERIVATIVE_FAILURES.get(body.prompt)
    })
    return Response.json({ type: 'job', job_id: jobId })
  }

/**
 * `pub_key` in the JSON body, as the client sends it; the query string as a
 * fallback, so a body too broken to read still reaches the handler's own
 * `invalid_request` rather than a missing-key refusal.
 */
const POST_GATE = { protected: { source: 'both' } } as const

route(
  'POST',
  '/derivative/image/generate/',
  startJob('generate', () => undefined),
  POST_GATE
)

route(
  'POST',
  '/derivative/image/edit/',
  startJob('edit', (request, body) => {
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
  }),
  POST_GATE
)

/**
 * One frame per poll: `processing`, then `uploading`, then `success` with
 * `is_ready: false` (the file is stored, but — as the real API reports while it
 * is still being ingested — not CDN-ready yet), then `success` with `is_ready:
 * true` for good. A scenario job (`DERIVATIVE_FAILURES`) reports `processing`
 * once and then its error frame for good. The client keeps polling on every
 * frame but an error or a ready success, so this walks it through each.
 */
const frame = (session: Session, job: DerivativeJob) => {
  job.polls += 1
  if (job.polls === 1) return { type: 'job', status: 'processing' }
  if (job.failure)
    return {
      type: 'job',
      status: 'error',
      error_source: 'ai_gateway',
      error_code: job.failure.code,
      error: job.failure.message
    }
  if (job.polls === 2) return { type: 'job', status: 'uploading' }
  job.file ??= storeStockImage(session, job.name, job.isStored)
  return { status: 'success', ...fileInfo(job.file), is_ready: job.polls > 3 }
}

route(
  'GET',
  '/derivative/status/',
  ({ request }) => {
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
  },
  { protected: true }
)
