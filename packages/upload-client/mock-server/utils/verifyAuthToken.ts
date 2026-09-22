import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { SIGNED_UPLOADS_SECRET_KEY } from '../config'
import type { ServerErrorCode } from '../../src/tools/ServerErrorCode'

/**
 * The Upload API's token rules, as far as a mock can go: signature, expiry,
 * scope and the operation allowance.
 *
 * Checking them for real rather than recognizing well-known fake token strings
 * is what lets one suite run against both this server and production. A mock
 * that agrees with the client about a made-up token proves only that the two
 * agree; this one rejects anything the real API would reject, so a malformed
 * mint fails here too.
 */

/** Matches the Upload API's own tolerance for clock drift. */
const CLOCK_LEEWAY_SECONDS = 30

type Claims = {
  exp?: unknown
  uc?: { restrictions?: { scope?: unknown; limits?: { operations?: unknown } } }
}

/**
 * Statuses are the ones the Upload API answers with, measured rather than
 * assumed: 401 for a token it will not accept at all, 403 for one it accepts
 * but whose restrictions forbid the request.
 */
export type TokenRejection = {
  status: number
  statusText: string
  errorCode: ServerErrorCode
}

const invalid = (reason: string): TokenRejection => ({
  status: 401,
  statusText: `Invalid token. Reason: ${reason}`,
  errorCode: 'AccessTokenInvalidError'
})

/** Operations spent per token, for the lifetime of the process. */
const operationsSpent = new Map<string, number>()

const decodeSegment = (segment: string): unknown =>
  JSON.parse(Buffer.from(segment, 'base64url').toString())

const hasValidSignature = (
  header: string,
  payload: string,
  signature: string
): boolean => {
  const key = createHash('sha256')
    .update(SIGNED_UPLOADS_SECRET_KEY, 'utf8')
    .digest()
  const expected = createHmac('sha256', key)
    .update(`${header}.${payload}`)
    .digest('base64url')

  // Same length or `timingSafeEqual` throws rather than returning false.
  return (
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  )
}

/**
 * `scope` items match a path exactly, or as a whole-segment prefix when they
 * end in `*` directly after a `/`. A bare `*` matches everything.
 */
const isInScope = (scope: string[], path: string): boolean =>
  scope.some((item) =>
    item === '*' || item.endsWith('/*')
      ? path.startsWith(item.slice(0, -1))
      : item === path
  )

/** `undefined` when the token passes; the rejection to answer with otherwise. */
export const verifyAuthToken = (
  token: string,
  path: string
): TokenRejection | undefined => {
  const [header, payload, signature] = token.split('.')
  if (!header || !payload || !signature) {
    return invalid('unreadable or not a JWT')
  }

  let claims: Claims
  try {
    decodeSegment(header)
    claims = decodeSegment(payload) as Claims
  } catch {
    return invalid('unreadable or not a JWT')
  }

  if (!hasValidSignature(header, payload, signature)) {
    return invalid('signature does not match')
  }

  if (typeof claims.exp !== 'number') {
    return invalid('`exp` is required')
  }
  if (claims.exp + CLOCK_LEEWAY_SECONDS < Date.now() / 1000) {
    return {
      status: 401,
      statusText: 'Expired token.',
      errorCode: 'AccessTokenExpiredError'
    }
  }

  const { scope, limits } = claims.uc?.restrictions ?? {}
  if (Array.isArray(scope) && !isInScope(scope as string[], path)) {
    return {
      status: 403,
      statusText: '`uc.restrictions.scope` does not allow this endpoint.',
      errorCode: 'ScopeForbiddenError'
    }
  }

  const operations = limits?.operations
  if (typeof operations === 'number') {
    const spent = (operationsSpent.get(token) ?? 0) + 1
    operationsSpent.set(token, spent)
    if (spent > operations) {
      return {
        status: 403,
        statusText: 'The operation limit of the token is exhausted.',
        errorCode: 'OperationsLimitExceededError'
      }
    }
  }

  return undefined
}
