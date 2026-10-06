import { bodyFields } from '../../core/body.js'
import { apiError } from '../../core/responses.js'
import type { Session } from '../../state/store.js'
import {
  DERIVATIVE_DISABLED_PUBLIC_KEY,
  DERIVATIVE_INSTANT_PUBLIC_KEY,
  NO_STORING_KEY,
  SIGNED_UPLOADS_PUBLIC_KEY,
  SIGNED_UPLOADS_SECRET_KEY,
  THROTTLE_ONCE_FIELD,
  UNKNOWN_PROGRESS_KEY
} from './scenarios.js'

/**
 * The public keys the demo project recognises, mirroring the old mock server's
 * list.
 */
const ALLOWED_PUBLIC_KEYS = [
  'demopublickey',
  // Public test fixture (the old mock server's), not a real credential.
  'secret_public_key',
  NO_STORING_KEY,
  UNKNOWN_PROGRESS_KEY,
  SIGNED_UPLOADS_PUBLIC_KEY,
  DERIVATIVE_DISABLED_PUBLIC_KEY,
  DERIVATIVE_INSTANT_PUBLIC_KEY
]

/**
 * The Upload API checks the public key before it looks at anything else in the
 * request, so an unrelated 404 never masks a missing or invalid key.
 * `paramName` differs by route: query-string routes report on `pub_key`,
 * `/base/` reports on `UPLOADCARE_PUB_KEY` since that's where the client puts
 * it.
 */
export const requirePublicKey = (
  request: Request,
  publicKey: string | null,
  paramName = 'pub_key'
) => {
  if (!publicKey)
    // schema: publicKeyRequiredError / uploadcarePublicKeyRequiredError
    return apiError(
      request,
      403,
      `${paramName} is required.`,
      'ProjectPublicKeyInvalidError'
    )
  if (!ALLOWED_PUBLIC_KEYS.includes(publicKey))
    // schema: publicKeyInvalidError / uploadcarePublicKeyInvalidError
    return apiError(
      request,
      403,
      `${paramName} is invalid.`,
      'ProjectPublicKeyInvalidError'
    )
  return undefined
}

/** Matches the Upload API's own tolerance for clock drift. */
const CLOCK_LEEWAY_SECONDS = 30

/** Seconds, echoed in throttle-once's `retry-after` so the wait is observable. */
const RETRY_AFTER_SECONDS = 1

/** `[status, content, errorCode]`, ready for `apiError`. */
type Rejection = [number, string, string]

const invalid = (reason: string): Rejection => [
  401,
  `Invalid token. Reason: ${reason}`,
  'AccessTokenInvalidError'
]

const utf8 = (text: string) => new TextEncoder().encode(text)

/** Throws on anything that isn't base64url. */
const base64urlBytes = (segment: string) => {
  if (!/^[\w-]*$/.test(segment)) throw new Error('not base64url')
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

const decodeSegment = (segment: string): unknown =>
  JSON.parse(new TextDecoder().decode(base64urlBytes(segment)))

type Claims = {
  exp?: unknown
  uc?: { restrictions?: { scope?: unknown; limits?: { operations?: unknown } } }
}

/**
 * The Upload API's Bearer-token rules, as far as an emulator can go: signature,
 * expiry, scope and the operation allowance. Checked for real — HS256 keyed
 * with `sha256(SIGNED_UPLOADS_SECRET_KEY)`, as `generateAuthToken` mints them —
 * rather than recognising canned token strings, so `upload-client`'s
 * `authToken.test.ts` says the same thing against the emulator and against
 * production. WebCrypto, not `node:crypto`, so this entry stays browser-safe;
 * `subtle.verify` is constant-time.
 *
 * `path` is the request path with a trailing slash (`/base/`), which is what
 * `uc.restrictions.scope` items match: exactly, or as a prefix when they end in
 * `/*`. A scope item not starting with `/` (a bare `*`, say) makes the whole
 * token invalid rather than simply matching nothing, as the API does.
 * Operations are counted per token, per session.
 */
export const verifyAuthToken = async (
  token: string,
  path: string,
  session: Session
): Promise<Rejection | undefined> => {
  const [header, payload, signature, extra] = token.split('.')
  if (!header || !payload || !signature || extra !== undefined)
    return invalid('unreadable or not a JWT')

  let claims: Claims
  let signatureBytes: Uint8Array
  try {
    decodeSegment(header)
    claims = (decodeSegment(payload) ?? {}) as Claims
    signatureBytes = base64urlBytes(signature)
  } catch {
    return invalid('unreadable or not a JWT')
  }

  const { subtle } = globalThis.crypto
  const key = await subtle.importKey(
    'raw',
    await subtle.digest('SHA-256', utf8(SIGNED_UPLOADS_SECRET_KEY)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  const signed = utf8(`${header}.${payload}`)
  if (!(await subtle.verify('HMAC', key, signatureBytes, signed)))
    return invalid('signature does not match')

  if (typeof claims.exp !== 'number') return invalid('`exp` is required')
  if (claims.exp + CLOCK_LEEWAY_SECONDS < Date.now() / 1000)
    return [401, 'Expired token.', 'AccessTokenExpiredError']

  const { scope, limits } = claims.uc?.restrictions ?? {}
  if (Array.isArray(scope)) {
    const items = scope.map(String)
    if (items.some((item) => !item.startsWith('/')))
      return invalid('uc.restrictions.scope items must start with `/`')
    const inScope = items.some((item) =>
      item.endsWith('/*') ? path.startsWith(item.slice(0, -1)) : item === path
    )
    if (!inScope)
      return [
        403,
        '`uc.restrictions.scope` does not allow this endpoint.',
        'ScopeForbiddenError'
      ]
  }

  const operations = limits?.operations
  if (typeof operations === 'number') {
    const spent = (session.tokenOperations.get(token) ?? 0) + 1
    session.tokenOperations.set(token, spent)
    if (spent > operations)
      return [
        403,
        'The operation limit of the token is exhausted.',
        'OperationsLimitExceededError'
      ]
  }

  return undefined
}

/**
 * A protected route's whole gate, in the order the old mock server applied it:
 *
 * 1. Throttle-once (`THROTTLE_ONCE_FIELD`) — first, so a throttled request is
 *    throttled whatever its credential.
 * 2. A Bearer token, when an `Authorization` header is sent — checked instead of
 *    the public key, so an invalid key with a valid token succeeds (which is
 *    how a test proves the header reached the server). Sending `signature` or
 *    `expire` alongside it is refused: the client drops them when it sends a
 *    token, so either one arriving means something leaked.
 * 3. `SIGNED_UPLOADS_PUBLIC_KEY` with no token: `SignatureRequiredError`.
 * 4. The ordinary public-key check.
 *
 * Unprotected routes (`/from_url/status/`, the part `PUT`, CDN, telemetry)
 * never get here, so they ignore `Authorization` the way the Upload API does.
 */
export const authorize = async (
  request: Request,
  publicKey: string | null,
  paramName: string,
  path: string,
  session: Session
) => {
  const query = new URL(request.url).searchParams
  const body = await bodyFields(request)
  const field = (name: string) => body.get(name) ?? query.get(name)

  const throttleKey = field(THROTTLE_ONCE_FIELD)
  if (throttleKey && !session.throttledOnce.has(throttleKey)) {
    session.throttledOnce.add(throttleKey)
    // schema: requestWasThrottledError
    return apiError(
      request,
      429,
      'Request was throttled.',
      'RequestThrottledError',
      { 'retry-after': String(RETRY_AFTER_SECONDS) }
    )
  }

  const authorization = request.headers.get('authorization')
  if (authorization) {
    // A constant message: naming the offending parameter would echo a
    // request-derived value back.
    if (field('signature') || field('expire'))
      return apiError(
        request,
        403,
        'Do not use `signature` or `expire` together with a Bearer token.',
        'AccessTokenInvalidError'
      )
    if (!authorization.startsWith('Bearer '))
      return apiError(
        request,
        401,
        'Invalid Authorization header format.',
        'AccessTokenInvalidError'
      )
    const rejection = await verifyAuthToken(
      authorization.slice('Bearer '.length),
      path,
      session
    )
    return rejection && apiError(request, ...rejection)
  }

  if (publicKey === SIGNED_UPLOADS_PUBLIC_KEY)
    return apiError(
      request,
      400,
      '`signature` is required.',
      'SignatureRequiredError'
    )

  return requirePublicKey(request, publicKey, paramName)
}
