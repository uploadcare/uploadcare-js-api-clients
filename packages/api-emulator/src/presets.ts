/**
 * The named scenarios `session.use(name, args)` registers: each one a bundle of
 * `session.on()` scenarios and/or session settings, for a case a test can't
 * reach through the real API's own inputs.
 */
import { isRecord } from './core/body.js'
import { apiError } from './core/responses.js'
import type { ScenarioHandler, ScenarioMatch } from './core/scenarios.js'
import type { EmulatorSession } from './session.js'
import { STOCK_IMAGE } from './state/stock-image.js'
import { type Session, store } from './state/store.js'

export type PresetArgs = {
  /**
   * The next `times` (1) requests `match` covers answer `429
   * RequestThrottledError` with `retry-after: retryAfter` (1) seconds, before
   * any credential is checked.
   */
  throttle: { match: ScenarioMatch; times?: number; retryAfter?: number }
  /**
   * Signed Uploads on: a protected request with no Bearer token is refused
   * `SignatureRequiredError` (after the public-key check). For every project in
   * the session, or for `publicKey`'s alone, which it adds to the session's
   * projects. Mint tokens with `mintAuthToken`.
   */
  signedUploads: { publicKey?: string } | undefined
  /**
   * `/from_url/` jobs report `total: 'unknown'` while in progress, as for a
   * source that sends no `Content-Length`.
   */
  unknownProgress: undefined
  /**
   * `POST /from_url/` refuses `sourceUrl` (every source, without it) at once
   * with `Host does not exist.`, rather than the poll-time failure an
   * unreachable host gets.
   */
  hostNotFound: { sourceUrl?: string } | undefined
  /**
   * A file already in the project, as if uploaded before the test: the stock
   * image under `uuid`, stored. In every project, or in `publicKey`'s alone,
   * which it adds to the session's projects; another project's `/info/` and
   * `/group/` then can't find it.
   */
  storedFile: { uuid: string; publicKey?: string }
  /**
   * `POST /derivative/image/generate/` and `.../edit/` answer `403
   * derivative_disabled`.
   */
  derivativesDisabled: undefined
  /**
   * A derivative job's first status poll answers its terminal frame: polls the
   * rest of the chain until it stops reporting progress. Wraps the scenarios
   * registered before it, so after `derivativeFailure` it answers the error at
   * once.
   */
  derivativesInstant: undefined
  /**
   * Every derivative job started after it fails at poll time with `code`, the
   * AI-gateway failure: `processing` once, then the `error` frame for good. No
   * file is stored.
   */
  derivativeFailure: { code: DerivativeFailureCode }
}

const DERIVATIVE_FAILURES = {
  content_moderated: 'The request was rejected by content moderation.',
  provider_unavailable: 'The image generation provider is unavailable.'
}

export type DerivativeFailureCode = keyof typeof DERIVATIVE_FAILURES

export type PresetName = keyof PresetArgs

/** `use(name)` alone for a preset whose args are all optional. */
export type PresetArgsOf<N extends PresetName> = undefined extends PresetArgs[N]
  ? [args?: PresetArgs[N]]
  : [args: PresetArgs[N]]

const throttle = (
  handle: EmulatorSession,
  { match, times = 1, retryAfter = 1 }: PresetArgs['throttle']
) => {
  handle.on(
    match,
    ({ request }) =>
      // schema: requestWasThrottledError
      apiError(
        request,
        429,
        'Request was throttled.',
        'RequestThrottledError',
        {
          'retry-after': String(retryAfter)
        }
      ),
    { times }
  )
}

const signedUploads = (
  session: Session,
  { publicKey }: NonNullable<PresetArgs['signedUploads']> = {}
) => {
  if (publicKey === undefined) {
    session.signedUploads = true
    return
  }
  session.publicKeys.add(publicKey)
  if (session.signedUploads !== true) session.signedUploads.add(publicKey)
}

const queryOf = (request: Request, name: string) =>
  new URL(request.url).searchParams.get(name)

const unknownProgress = (handle: EmulatorSession) => {
  const tokens = new Set<string>()
  handle
    .on('POST /from_url/', async ({ next }) => {
      const response = await next()
      const body: unknown = await response?.clone().json()
      if (isRecord(body) && typeof body.token === 'string')
        tokens.add(body.token)
      return response
    })
    .on('GET /from_url/status/', async ({ request, next }) => {
      if (!tokens.has(queryOf(request, 'token') ?? '')) return undefined
      const response = await next()
      const body: unknown = await response?.clone().json()
      return isRecord(body) && body.status === 'progress'
        ? Response.json({ ...body, total: 'unknown' })
        : response
    })
}

const hostNotFound = (
  handle: EmulatorSession,
  { sourceUrl }: NonNullable<PresetArgs['hostNotFound']> = {}
) => {
  handle.on('POST /from_url/', ({ request }) => {
    const source = queryOf(request, 'source_url')
    if (!source || (sourceUrl !== undefined && source !== sourceUrl))
      return undefined
    // schema: hostnameNotFoundError
    return apiError(request, 400, 'Host does not exist.')
  })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const storedFile = (
  session: Session,
  { uuid, publicKey }: PresetArgs['storedFile']
) => {
  if (!UUID.test(uuid))
    throw new TypeError(`The storedFile preset: ${uuid} is not a file uuid`)
  if (publicKey !== undefined) session.publicKeys.add(publicKey)
  store(
    session,
    {
      name: 'demo.jpg',
      mimeType: 'image/jpeg',
      bytes: STOCK_IMAGE,
      isStored: true,
      publicKey
    },
    uuid
  )
}

const GENERATE = 'POST /derivative/image/generate/'
const EDIT = 'POST /derivative/image/edit/'
const STATUS = 'GET /derivative/status/'

const refuseDerivatives: ScenarioHandler = ({ request }) =>
  apiError(
    request,
    403,
    'Derivatives are not enabled for this project.',
    'derivative_disabled'
  )

const derivativesDisabled = (handle: EmulatorSession) => {
  handle.on(GENERATE, refuseDerivatives).on(EDIT, refuseDerivatives)
}

const isPending = (frame: unknown) =>
  isRecord(frame) &&
  (frame.status === 'processing' ||
    frame.status === 'uploading' ||
    (frame.status === 'success' && frame.is_ready === false))

const derivativesInstant = (handle: EmulatorSession) => {
  handle.on(STATUS, async ({ next }) => {
    let response = await next()
    // ponytail: bounded at 8, twice the real walk, in case a scenario down the
    // chain never stops reporting progress.
    for (let poll = 1; poll < 8; poll += 1) {
      if (!isPending(await response?.clone().json())) break
      response = await next()
    }
    return response
  })
}

const derivativeFailure = (
  handle: EmulatorSession,
  { code }: PresetArgs['derivativeFailure']
) => {
  /** Polls answered per job this preset failed. */
  const polls = new Map<string, number>()
  const start: ScenarioHandler = async ({ next }) => {
    const response = await next()
    const body: unknown = await response?.clone().json()
    if (isRecord(body) && typeof body.job_id === 'string')
      polls.set(body.job_id, 0)
    return response
  }
  handle
    .on(GENERATE, start)
    .on(EDIT, start)
    .on(STATUS, ({ request }) => {
      const jobId = queryOf(request, 'job_id') ?? ''
      const answered = polls.get(jobId)
      if (answered === undefined) return undefined
      polls.set(jobId, answered + 1)
      return Response.json(
        answered === 0
          ? { type: 'job', status: 'processing' }
          : {
              type: 'job',
              status: 'error',
              error_source: 'ai_gateway',
              error_code: code,
              error: DERIVATIVE_FAILURES[code]
            }
      )
    })
}

type Preset<N extends PresetName> = (
  session: Session,
  handle: EmulatorSession,
  ...args: PresetArgsOf<N>
) => void

const PRESETS: { [N in PresetName]: Preset<N> } = {
  throttle: (_, handle, args) => throttle(handle, args),
  signedUploads: (session, _, args) => signedUploads(session, args),
  unknownProgress: (_, handle) => unknownProgress(handle),
  hostNotFound: (_, handle, args) => hostNotFound(handle, args),
  storedFile: (session, _, args) => storedFile(session, args),
  derivativesDisabled: (_, handle) => derivativesDisabled(handle),
  derivativesInstant: (_, handle) => derivativesInstant(handle),
  derivativeFailure: (_, handle, args) => derivativeFailure(handle, args)
}

export const applyPreset = <N extends PresetName>(
  session: Session,
  handle: EmulatorSession,
  name: N,
  ...args: PresetArgsOf<N>
) => {
  if (!Object.hasOwn(PRESETS, name))
    throw new TypeError(`No such preset: ${JSON.stringify(name)}`)
  const preset: Preset<N> = PRESETS[name]
  preset(session, handle, ...args)
}
