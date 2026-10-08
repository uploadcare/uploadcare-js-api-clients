import { handle } from './index.js'
import type { EmulatorSession } from './session.js'

/**
 * The hosts the emulator answers for: the Upload API, the CDN (`ucarecdn.com`
 * and the per-project `<prefix>.ucarecd.net`) and the telemetry sink — see
 * `apis/`. `handle` routes by path alone, so the host check lives here, shared
 * by `./browser`, `./msw` and `./node`.
 */
const UPLOADCARE_HOSTS = [
  'upload.uploadcare.com',
  'tlm.uploadcare.com',
  'ucarecdn.com',
  'ucarecd.net'
]
const PREFIXED_CDN = /\.ucarecd\.net$/
/** Any other Uploadcare host is refused even under `unhandled: 'passthrough'`. */
const UPLOADCARE_DOMAIN = /(^|\.)(uploadcare\.com|ucarecdn\.com|ucarecd\.net)$/

export type EmulatorOptions = {
  /**
   * Extra CDN hostnames to emulate, for a project's custom cname
   * (`['cdn.example.com']`). Hostnames, not URLs.
   */
  cdnHosts?: readonly string[]
  /**
   * What to do with a request to any other origin (in the browser, other than
   * the page's own, which always passes through: that's the dev server).
   *
   * - `'error'` (default): fail it as a network error and `console.error` its
   *   URL, so a new or mistyped endpoint can't quietly reach a real service.
   * - `'passthrough'`: let it go out to the network, unless it's an Uploadcare
   *   host the emulator doesn't answer (`api.uploadcare.com`, …): that is still
   *   refused.
   */
  unhandled?: 'error' | 'passthrough'
}

/** What `./browser` and `./node` hand back. */
export type Emulator = {
  /**
   * Starts answering requests (once; later calls reuse it) and resets the
   * default session, scenarios included. Call it before every test; register
   * the test's scenarios on the session it answers.
   */
  reset(): Promise<EmulatorSession>
  /** Stops answering; a later `reset()` starts again. */
  stop(): Promise<void>
}

export type Decision =
  | { kind: 'emulate' }
  | { kind: 'passthrough' }
  | { kind: 'refuse'; error: TypeError }

/**
 * Where each request goes under `options`. `ownOrigin` always passes through
 * (the page's, in the browser; Node has none).
 */
export const createPolicy = (
  { cdnHosts = [], unhandled = 'error' }: EmulatorOptions,
  ownOrigin?: string
) => {
  for (const host of cdnHosts) {
    if (!/^[a-z0-9.-]+$/i.test(host)) {
      throw new TypeError(`cdnHosts takes hostnames, got ${host}`)
    }
  }
  const emulated = new Set(
    [...UPLOADCARE_HOSTS, ...cdnHosts].map((host) => host.toLowerCase())
  )

  return (request: Request): Decision => {
    const url = new URL(request.url)
    if (emulated.has(url.hostname) || PREFIXED_CDN.test(url.hostname)) {
      return { kind: 'emulate' }
    }
    if (url.origin === ownOrigin) return { kind: 'passthrough' }
    const uploadcare = UPLOADCARE_DOMAIN.test(url.hostname)
    if (!uploadcare && unhandled === 'passthrough') {
      return { kind: 'passthrough' }
    }
    const message = uploadcare
      ? `@uploadcare/api-emulator does not emulate ${request.method} ${request.url}`
      : `@uploadcare/api-emulator: ${request.method} ${request.url} is neither Uploadcare nor ${ownOrigin ? "this page's origin" : "allowed by unhandled: 'passthrough'"}`
    console.error(message)
    return { kind: 'refuse', error: new TypeError(message) }
  }
}

/**
 * The emulator's answer to an emulated request; `undefined` for a route it
 * doesn't have or a dropped connection (`Response.error()`), both of which the
 * caller fails as a network error. The missing route is named in the console.
 */
export const answer = async (request: Request) => {
  const response = await handle(request)
  if (!response) {
    console.warn(
      `@uploadcare/api-emulator does not implement ${request.method} ${request.url}`
    )
  }
  return response?.type === 'error' ? undefined : response
}
