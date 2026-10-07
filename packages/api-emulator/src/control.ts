/**
 * `./listen`'s control endpoint: a test in another process registers its
 * session's scenarios over HTTP. Functions can't cross the process boundary, so
 * it takes a preset by name (`{ preset, args }`, as `session.use()`) or a
 * declared response (`{ match, status, body, headers, delay, times }`);
 * `DELETE` clears them. The session is the request's `SESSION_HEADER`.
 */
import { isRecord } from './core/body.js'
import { applyPreset, isPresetName } from './presets.js'
import { handleOf } from './session.js'
import { type Session, clearScenarios, sessionOf } from './state/store.js'

export const CONTROL_PATH = '/__emulator/scenarios'

const plain = (status: number, body?: string) =>
  new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  })

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isHeaders = (value: unknown): value is Record<string, string> =>
  isRecord(value) &&
  Object.values(value).every((header) => typeof header === 'string')

/** The declared response, built once here so a bad one is refused up front. */
const declared = (spec: Record<string, unknown>) => {
  const { status = 200, body, headers = {}, delay: ms = 0 } = spec
  if (
    typeof status !== 'number' ||
    !Number.isInteger(status) ||
    status < 200 ||
    status > 599
  )
    throw new TypeError('status is an integer from 200 to 599')
  if (!isHeaders(headers)) throw new TypeError('headers map names to strings')
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0)
    throw new TypeError('delay is a number of milliseconds, 0 or more')
  const build = () =>
    body === undefined || typeof body === 'string'
      ? new Response(body, { status, headers })
      : Response.json(body, { status, headers })
  build()
  return async () => {
    if (ms > 0) await delay(ms)
    return build()
  }
}

const register = (session: Session, spec: Record<string, unknown>) => {
  const handle = handleOf(session)
  if ('preset' in spec) {
    if (!isPresetName(spec.preset))
      throw new TypeError(`No such preset: ${JSON.stringify(spec.preset)}`)
    applyPreset(session, handle, spec.preset, spec.args)
    return
  }
  const { match, times } = spec
  if (typeof match !== 'string' && !isRecord(match))
    throw new TypeError('match is a string or an object')
  if (times !== undefined && typeof times !== 'number')
    throw new TypeError('times is a positive integer')
  handle.on(match, declared(spec), { times })
}

/** The control endpoint's answer, or `undefined` for any other request. */
export const control = async (request: Request) => {
  const { pathname } = new URL(request.url)
  if (pathname.replace(/\/$/, '') !== CONTROL_PATH) return undefined
  const session = sessionOf(request)
  if (request.method === 'DELETE') {
    clearScenarios(session)
    return plain(204)
  }
  if (request.method !== 'POST') return undefined
  const spec: unknown = await request.json().catch(() => undefined)
  if (!isRecord(spec)) return plain(400, 'The body is a JSON object')
  try {
    register(session, spec)
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
    return plain(400, error.message)
  }
  return plain(204)
}
