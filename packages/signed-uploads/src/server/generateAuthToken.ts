import { createHash, createHmac } from 'node:crypto'

/**
 * The Upload API refuses a token that outlives this, so it is rejected here
 * instead — at mint time, where the stack trace names the caller.
 */
const MAX_LIFETIME_SECONDS = 86400
const MAX_SCOPE_ITEMS = 16
const MAX_SCOPE_ITEM_LENGTH = 64
const MAX_OPERATIONS = 100_000

export type AuthTokenExpiration =
  | {
      /**
       * The expiration timestamp of the token in milliseconds since the epoch
       * or just Date object.
       */
      expire: number | Date
    }
  | {
      /** The lifetime of the token in milliseconds */
      lifetime: number
    }

export type AuthTokenRestrictions = {
  /**
   * Upload API endpoints this token reaches, as paths. An item matches exactly
   * or, with a trailing `*` after a `/`, as a whole-segment prefix (`/*` and
   * `*` match everything). Omit to allow every signed endpoint.
   *
   * @example ['/base/', '/multipart/*']
   */
  scope?: string[]
  /** The maximum number of operations this token allows, 1 to 100000. */
  operations?: number
}

export type AuthTokenClaims = {
  /** `iss` claim. */
  issuer?: string
  /** `sub` claim. */
  subject?: string
  /** `jti` claim. */
  tokenId?: string
}

export type GenerateAuthTokenOptions = AuthTokenExpiration &
  AuthTokenRestrictions &
  AuthTokenClaims

const msToUnixTimestamp = (ms: number) => Math.floor(ms / 1000)

const base64url = (input: string) => Buffer.from(input).toString('base64url')

const getExpiration = (options: AuthTokenExpiration, iat: number) => {
  if ('expire' in options) {
    return msToUnixTimestamp(new Date(options.expire).getTime())
  }

  return iat + msToUnixTimestamp(options.lifetime)
}

/**
 * Reject a scope the Upload API would reject, with the same requirement in the
 * message. `*` is accepted only as a whole trailing segment, because `/base*`
 * would otherwise also match `/base_admin/`.
 */
const validateScope = (scope: string[]) => {
  if (scope.length === 0) {
    throw new Error('`scope` can not be empty')
  }

  if (scope.length > MAX_SCOPE_ITEMS) {
    throw new Error(
      `\`scope\` can not contain more than ${MAX_SCOPE_ITEMS} items`
    )
  }

  for (const item of scope) {
    if (!item) {
      throw new Error('`scope` can not contain empty items')
    }

    if (item.length > MAX_SCOPE_ITEM_LENGTH) {
      throw new Error(
        `\`scope\` can not contain items longer than ${MAX_SCOPE_ITEM_LENGTH} symbols`
      )
    }

    if (item === '*') {
      continue
    }

    if (!item.startsWith('/')) {
      throw new Error('`scope` items must start with `/`')
    }

    const prefix = item.endsWith('*') ? item.slice(0, -1) : item
    if (prefix.includes('*') || (item.endsWith('*') && !prefix.endsWith('/'))) {
      throw new Error(
        '`scope` supports `*` only as the last symbol of an item, after a `/`'
      )
    }
  }
}

const buildPayload = (
  options: GenerateAuthTokenOptions,
  iat: number,
  exp: number
) => {
  const payload: Record<string, unknown> = { exp, iat }

  if (options.issuer !== undefined) payload.iss = options.issuer
  if (options.subject !== undefined) payload.sub = options.subject
  if (options.tokenId !== undefined) payload.jti = options.tokenId

  const restrictions: Record<string, unknown> = {}

  if (options.scope !== undefined) {
    validateScope(options.scope)
    restrictions.scope = options.scope
  }

  if (options.operations !== undefined) {
    if (
      !Number.isInteger(options.operations) ||
      options.operations < 1 ||
      options.operations > MAX_OPERATIONS
    ) {
      throw new Error(
        `\`operations\` must be an integer between 1 and ${MAX_OPERATIONS}`
      )
    }
    restrictions.limits = { operations: options.operations }
  }

  // The Upload API validates claims strictly and forbids unknown ones, so an
  // empty `uc` is left out rather than sent as an empty object.
  if (Object.keys(restrictions).length > 0) {
    payload.uc = { restrictions }
  }

  return payload
}

/**
 * Generate a JWT for the Upload API `Authorization: Bearer <token>` scheme.
 *
 * Run this on your server: it needs the project secret key, which must never
 * reach a browser. Hand the resulting string to the browser and pass it to
 * `@uploadcare/upload-client` as `authToken`.
 *
 * @param secretKey - The project secret key.
 * @param options - Expiration, plus optional scope and operation limits.
 * @see https://uploadcare.com/docs/security/secure-uploads-auth-token/
 */
export const generateAuthToken = (
  secretKey: string,
  options: GenerateAuthTokenOptions
): string => {
  if (!secretKey) {
    throw new Error('`secretKey` is required')
  }

  const iat = msToUnixTimestamp(Date.now())
  const exp = getExpiration(options, iat)

  if (!Number.isInteger(exp)) {
    throw new Error('`expire` must be a valid date')
  }

  const lifetime = exp - iat
  if (lifetime < 1) {
    throw new Error('`expire` must be in the future')
  }

  if (lifetime > MAX_LIFETIME_SECONDS) {
    throw new Error(
      `\`expire\` can not be more than ${MAX_LIFETIME_SECONDS} seconds ahead`
    )
  }

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify(buildPayload(options, iat, exp)))

  // HS256 wants at least 256 bits of key and project secret keys are 160, so
  // the Upload API signs with the SHA-256 digest of the secret key.
  const signingKey = createHash('sha256').update(secretKey, 'utf8').digest()
  const signature = createHmac('sha256', signingKey)
    .update(`${header}.${payload}`)
    .digest('base64url')

  return `${header}.${payload}.${signature}`
}
