import { bodyFields } from '../../core/body.js'
import { apiError } from '../../core/responses.js'
import type { RouteContext, RouteHandler } from '../../core/router.js'
import { type Session, sessionOf } from '../../state/store.js'
import {
  DERIVATIVE_DISABLED_PUBLIC_KEY,
  DERIVATIVE_INSTANT_PUBLIC_KEY,
  NO_STORING_KEY,
  SIGNED_UPLOADS_PUBLIC_KEY,
  SIGNED_UPLOADS_SECRET_KEY,
  UNKNOWN_PROGRESS_KEY
} from './scenarios.js'

/** The public keys the demo project recognises. */
const ALLOWED_PUBLIC_KEYS = [
  'demopublickey',
  // Public test fixture, not a real credential.
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
 */
const requirePublicKey = (
  request: Request,
  publicKey: string | null,
  paramName: string
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
 * production. The header's `alg` must be `HS256`. WebCrypto, not `node:crypto`,
 * so this entry stays browser-safe; `subtle.verify` is constant-time.
 *
 * `path` is the request path with a trailing slash (`/base/`), which is what
 * `uc.restrictions.scope` items match: exactly, or as a prefix when they end in
 * `/*`. A scope item not starting with `/` (a bare `*`, say) makes the whole
 * token invalid rather than simply matching nothing, as the API does.
 * Operations are counted per token, per session.
 */
const verifyAuthToken = async (
  token: string,
  path: string,
  session: Session
): Promise<Rejection | undefined> => {
  const [header, payload, signature, extra] = token.split('.')
  if (!header || !payload || !signature || extra !== undefined)
    return invalid('unreadable or not a JWT')

  let protectedHeader: { alg?: unknown }
  let claims: Claims
  let signatureBytes: Uint8Array
  try {
    protectedHeader = (decodeSegment(header) ?? {}) as { alg?: unknown }
    claims = (decodeSegment(payload) ?? {}) as Claims
    signatureBytes = base64urlBytes(signature)
  } catch {
    return invalid('unreadable or not a JWT')
  }

  if (protectedHeader.alg !== 'HS256') return invalid('`alg` must be HS256')

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
 * A protected route's whole gate, in order:
 *
 * 1. A Bearer token, when an `Authorization` header is sent — checked instead of
 *    the public key, so an invalid key with a valid token succeeds (which is
 *    how a test proves the header reached the server). Sending `signature` or
 *    `expire` alongside it is refused: the client drops them when it sends a
 *    token, so either one arriving means something leaked.
 * 2. `SIGNED_UPLOADS_PUBLIC_KEY` with no token: `SignatureRequiredError`.
 * 3. The ordinary public-key check.
 *
 * Unprotected routes (`/from_url/status/`, the part `PUT`, CDN, telemetry)
 * never get here, so they ignore `Authorization` the way the Upload API does.
 */
const authorize = async (
  request: Request,
  field: (name: string) => string | null,
  paramName: string
) => {
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
    const { pathname } = new URL(request.url)
    const rejection = await verifyAuthToken(
      authorization.slice('Bearer '.length),
      pathname.endsWith('/') ? pathname : `${pathname}/`,
      sessionOf(request)
    )
    return rejection && apiError(request, ...rejection)
  }

  const publicKey = field(paramName)
  if (publicKey === SIGNED_UPLOADS_PUBLIC_KEY)
    return apiError(
      request,
      400,
      '`signature` is required.',
      'SignatureRequiredError'
    )

  return requirePublicKey(request, publicKey, paramName)
}

/**
 * Puts the Upload API's gate in front of `handler`, which then gets the
 * request's public key too (`null` when a Bearer token stood in for it).
 *
 * `paramName` is both where the key is read from and the name a missing or
 * invalid one is reported under: `UPLOADCARE_PUB_KEY` for `/base/` and the
 * multipart routes, `pub_key` everywhere else. Every field — the key included —
 * is read from the body first (a form, or the derivative endpoints' JSON; see
 * `bodyFields`), then the query string.
 */
export const protect =
  (
    handler: (
      context: RouteContext & { publicKey: string | null }
    ) => ReturnType<RouteHandler>,
    paramName = 'pub_key'
  ): RouteHandler =>
  async (context) => {
    const body = await bodyFields(context.request)
    const query = new URL(context.request.url).searchParams
    const field = (name: string) => body.get(name) ?? query.get(name)
    const rejection = await authorize(context.request, field, paramName)
    return rejection ?? handler({ ...context, publicKey: field(paramName) })
  }
