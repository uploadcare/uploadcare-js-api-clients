/**
 * The named scenarios `session.use(name, args)` registers: each one a bundle of
 * `session.on()` scenarios and/or session settings, for a case a test can't
 * reach through the real API's own inputs. The names and args are the same
 * strings `./listen`'s control endpoint takes, so every arg is plain JSON.
 */
import { isRecord } from './core/body.js'
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
    default: {
      // A new preset fails to compile here until it is handled; a name from
      // the control endpoint that isn't one fails at runtime.
      const unknown: never = name
      throw new TypeError(`No such preset: ${JSON.stringify(unknown)}`)
    }
  }
}
