/**
 * The named scenarios `session.use(name, args)` registers: each one a bundle of
 * `session.on()` scenarios and/or session settings, for a case a test can't
 * reach through the real API's own inputs. The names and args are the same
 * strings `./listen`'s control endpoint takes, so every arg is plain JSON.
 */
import { bodyFields, isRecord } from './core/body.js'
import { apiError } from './core/responses.js'
import type { ScenarioMatch } from './core/scenarios.js'
import type { EmulatorSession } from './session.js'
import type { Session } from './state/store.js'

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
   * source that sends no `Content-Length`. Every job, or `publicKey`'s alone,
   * which it adds to the session's projects.
   */
  unknownProgress: { publicKey?: string } | undefined
  /**
   * `POST /from_url/` refuses `sourceUrl` (every source, without it) at once
   * with `Host does not exist.`, rather than the poll-time failure an
   * unreachable host gets.
   */
  hostNotFound: { sourceUrl?: string } | undefined
}

export type PresetName = keyof PresetArgs

/** `use(name)` alone for a preset whose args are all optional. */
export type PresetArgsOf<N extends PresetName> = undefined extends PresetArgs[N]
  ? [args?: PresetArgs[N]]
  : [args: PresetArgs[N]]

type Args = Record<string, unknown>

/** Args arrive as JSON from `./listen`'s control endpoint too: checked here. */
const invalid = (preset: string, message: string) =>
  new TypeError(`The ${preset} preset: ${message}`)

const argsOf = (preset: string, args: unknown): Args => {
  if (args === undefined) return {}
  if (isRecord(args)) return args
  throw invalid(preset, 'args are an object')
}

const count = (preset: string, args: Args, key: string) => {
  const value = args[key]
  if (value === undefined) return undefined
  if (typeof value === 'number' && Number.isInteger(value) && value > 0)
    return value
  throw invalid(preset, `${key} is a positive integer`)
}

const string = (preset: string, args: Args, key: string) => {
  const value = args[key]
  if (value === undefined || typeof value === 'string') return value
  throw invalid(preset, `${key} is a string`)
}

/** Checked in full by `session.on()`. */
const match = (preset: string, args: Args): ScenarioMatch => {
  const value = args.match
  if (typeof value === 'string' || isRecord(value)) return value
  throw invalid(preset, 'match is a string or an object')
}

const throttle = (handle: EmulatorSession, args: Args) => {
  const retryAfter = String(count('throttle', args, 'retryAfter') ?? 1)
  handle.on(
    match('throttle', args),
    ({ request }) =>
      // schema: requestWasThrottledError
      apiError(
        request,
        429,
        'Request was throttled.',
        'RequestThrottledError',
        {
          'retry-after': retryAfter
        }
      ),
    { times: count('throttle', args, 'times') ?? 1 }
  )
}

const signedUploads = (session: Session, args: Args) => {
  const publicKey = string('signedUploads', args, 'publicKey')
  if (publicKey === undefined) {
    session.signedUploads = true
    return
  }
  session.publicKeys.add(publicKey)
  if (session.signedUploads !== true) session.signedUploads.add(publicKey)
}

const publicKeyOf = async (request: Request) =>
  (await bodyFields(request)).get('pub_key') ??
  new URL(request.url).searchParams.get('pub_key')

const queryOf = (request: Request, name: string) =>
  new URL(request.url).searchParams.get(name)

const unknownProgress = (
  session: Session,
  handle: EmulatorSession,
  args: Args
) => {
  const publicKey = string('unknownProgress', args, 'publicKey')
  if (publicKey !== undefined) session.publicKeys.add(publicKey)
  const tokens = new Set<string>()
  handle
    .on('POST /from_url/', async ({ request, next }) => {
      if (publicKey !== undefined && (await publicKeyOf(request)) !== publicKey)
        return undefined
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

const hostNotFound = (handle: EmulatorSession, args: Args) => {
  const sourceUrl = string('hostNotFound', args, 'sourceUrl')
  handle.on('POST /from_url/', ({ request }) => {
    const source = queryOf(request, 'source_url')
    if (!source || (sourceUrl !== undefined && source !== sourceUrl))
      return undefined
    // schema: hostnameNotFoundError
    return apiError(request, 400, 'Host does not exist.')
  })
}

export const applyPreset = (
  session: Session,
  handle: EmulatorSession,
  name: PresetName,
  args: unknown
) => {
  switch (name) {
    case 'throttle':
      return throttle(handle, argsOf(name, args))
    case 'signedUploads':
      return signedUploads(session, argsOf(name, args))
    case 'unknownProgress':
      return unknownProgress(session, handle, argsOf(name, args))
    case 'hostNotFound':
      return hostNotFound(handle, argsOf(name, args))
    default: {
      // A new preset fails to compile here until it is handled; a name from
      // the control endpoint that isn't one fails at runtime.
      const unknown: never = name
      throw new TypeError(`No such preset: ${JSON.stringify(unknown)}`)
    }
  }
}
