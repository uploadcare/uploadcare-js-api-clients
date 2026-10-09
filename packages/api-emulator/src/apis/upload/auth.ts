import { bodyFields } from '../../core/body.js'
import { apiError } from '../../core/responses.js'
import type { RouteContext, RouteHandler } from '../../core/router.js'
import { type Session, sessionOf } from '../../state/store.js'

/**
 * The secret Bearer tokens are verified against: HS256 keyed with
 * `sha256(secret)`, as `@uploadcare/signed-uploads`' `generateAuthToken` mints
 * them. Exported from `.`, for a test that mints its own tokens;
 * `mintAuthToken` mints with it too.
 */
// Public test fixture, documented in the README — not a real credential.
export const SIGNED_UPLOADS_SECRET_KEY = 'mock_secret_key'

/**
 * A public key for a project with Signed Uploads on: pass it to the
 * `signedUploads` preset (`use('signedUploads', { publicKey })`) and mint its
 * tokens with `SIGNED_UPLOADS_SECRET_KEY`. Any key works there; this one saves
 * each suite inventing its own.
 */
// Public test fixture, documented in the README — not a real credential.
export const SIGNED_UPLOADS_PUBLIC_KEY = 'signed_uploads_public_key'

/**
 * The public keys of the demo account's projects. A preset that names a key
 * (`signedUploads`' `publicKey`, say) adds that project to its session.
 */
const ALLOWED_PUBLIC_KEYS = [
  'demopublickey',
  // Public test fixture, not a real credential.
  'secret_public_key'
]

/**
 * The Upload API checks the public key before it looks at anything else in the
 * request, so an unrelated 404 never masks a missing or invalid key.
 */
const requirePublicKey = (
  request: Request,
  session: Session,
  publicKey: string | null,
  paramName: string
) => {
  if (!publicKey)
    // schema: publicKeyRequiredError / uploadcarePublicKeyRequiredError
    return apiError(
      request,
      403,
      `${paramName} is required.`,
      'ProjectPublicKeyRequiredError'
    )
  if (
    !ALLOWED_PUBLIC_KEYS.includes(publicKey) &&
    !session.publicKeys.has(publicKey)
  )
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

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const signingKey = async (usage: 'sign' | 'verify') => {
  const { subtle } = globalThis.crypto
  return subtle.importKey(
    'raw',
    await subtle.digest('SHA-256', utf8(SIGNED_UPLOADS_SECRET_KEY)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  )
}

export type MintAuthTokenOptions = {
  /** Milliseconds; a minute by default. */
  lifetime?: number
  /** The `jti` claim. */
  tokenId?: string
  /** `uc.restrictions.scope`: paths, exactly or as a `/*` prefix. */
  scope?: string[]
  /** `uc.restrictions.limits.operations`. */
  operations?: number
}

/**
 * A Bearer token the emulator accepts, signed with `SIGNED_UPLOADS_SECRET_KEY`
 * the way `generateAuthToken` signs, but with WebCrypto, so it mints in a page
 * too. Doesn't validate its options the way `generateAuthToken` does: a test
 * may want a token the API refuses.
 */
export const mintAuthToken = async ({
  lifetime = 60_000,
  tokenId,
  scope,
  operations
}: MintAuthTokenOptions = {}) => {
  const iat = Math.floor(Date.now() / 1000)
  const claims: Record<string, unknown> = {
    exp: iat + Math.floor(lifetime / 1000),
    iat
  }
  if (tokenId !== undefined) claims.jti = tokenId
  const restrictions: Record<string, unknown> = {}
  if (scope !== undefined) restrictions.scope = scope
  if (operations !== undefined) restrictions.limits = { operations }
  if (Object.keys(restrictions).length > 0) claims.uc = { restrictions }

  const header = { alg: 'HS256', typ: 'JWT' }
  const signed = [header, claims]
    .map((part) => base64url(utf8(JSON.stringify(part))))
    .join('.')
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    await signingKey('sign'),
    utf8(signed)
  )
  return `${signed}.${base64url(new Uint8Array(signature))}`
}

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

  const signed = utf8(`${header}.${payload}`)
  const key = await signingKey('verify')
  if (
    !(await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      signed
    ))
  )
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
 * 2. The public-key check.
 * 3. No token for a project with Signed Uploads on (the `signedUploads` preset):
 *    `SignatureRequiredError`.
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

  const session = sessionOf(request)
  const publicKey = field(paramName)
  const refusal = requirePublicKey(request, session, publicKey, paramName)
  if (refusal) return refusal

  const { signedUploads } = session
  if (signedUploads === true || signedUploads.has(publicKey ?? ''))
    return apiError(
      request,
      400,
      '`signature` is required.',
      'SignatureRequiredError'
    )
  return undefined
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
