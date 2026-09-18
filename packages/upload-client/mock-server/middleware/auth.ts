import { ROUTES, RouteType } from '../routes'
import { ALLOWED_PUBLIC_KEYS } from '../config'
import error from '../utils/error'
import { type Middleware } from 'koa'

/** Routes protected by auth. */
const protectedRoutes: Array<string> = ROUTES.filter((route: RouteType) => {
  const keys = Object.keys(route)
  const path = keys[0]

  return route[path].isProtected
}).map((route: RouteType) => {
  const keys = Object.keys(route)

  return keys[0]
})

/**
 * Check is url protected by auth.
 *
 * @param {string} url
 * @returns {boolean}
 */
const isProtected = (url: string) =>
  !!protectedRoutes.filter((path: string) => url === path).length

/**
 * Get public key value from request.
 *
 * @param {Record<string, string>} source
 * @param {string} key
 */
const getPublicKeyFromSource = (
  source: Record<string, string>,
  key: string
): string => {
  return typeof source[key] !== 'undefined' ? source[key] : ''
}

type IsAuthorizedParams = {
  url: string
  publicKey: string
}
/**
 * Check auth.
 *
 * @param {string} url
 * @param {string} publicKey
 * @returns {boolean}
 */
const isAuthorized = ({ url, publicKey }: IsAuthorizedParams) => {
  if (!isProtected(url)) {
    return true
  }

  return !!(publicKey && ALLOWED_PUBLIC_KEYS.includes(publicKey))
}

/** JWTs recognized by the mock server. */
const VALID_JWT = 'valid-jwt'
const JWT_ERRORS: Record<string, { statusText: string; errorCode: string }> = {
  'expired-jwt': {
    statusText: 'Token has expired.',
    errorCode: 'TokenExpiredError'
  },
  'quota-jwt': {
    statusText: 'Operation quota exhausted.',
    errorCode: 'TokenOperationsExhaustedError'
  },
  'scope-jwt': {
    statusText: 'Endpoint is not in the token scope.',
    errorCode: 'TokenScopeForbiddenError'
  }
}

/**
 * Bearer token auth. Runs before the pub_key check whenever the header is
 * present, so tests can prove the header actually reached the server (an
 * invalid pub_key + valid JWT must succeed, an invalid JWT must fail even with
 * a valid pub_key). Rejects requests carrying both auth schemes to lock in the
 * client-side precedence rule (header wins, signature params dropped).
 */
const bearerAuth = (ctx: Parameters<Middleware>[0]): boolean => {
  const authHeader = ctx.get('Authorization')

  const signature =
    ctx.query.signature || (ctx.request.body && ctx.request.body.signature)
  if (signature) {
    error(ctx, {
      status: 403,
      statusText:
        'Do not use signature parameters together with a Bearer token.',
      errorCode: 'TokenInvalidError'
    })
    return false
  }

  if (!authHeader.startsWith('Bearer ')) {
    error(ctx, {
      status: 403,
      statusText: 'Invalid Authorization header format.',
      errorCode: 'TokenInvalidError'
    })
    return false
  }

  const jwt = authHeader.slice('Bearer '.length)

  if (JWT_ERRORS[jwt]) {
    error(ctx, { status: 403, ...JWT_ERRORS[jwt] })
    return false
  }

  if (jwt !== VALID_JWT) {
    error(ctx, {
      status: 403,
      statusText: 'Token is invalid.',
      errorCode: 'TokenInvalidError'
    })
    return false
  }

  return true
}

/** Uploadcare Auth middleware. */
const auth: Middleware = (ctx, next) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const urlWithSlash = ctx.url.split('?').shift()!
  const url = urlWithSlash.substring(0, urlWithSlash.length - 1)

  if (isProtected(url) && ctx.get('Authorization')) {
    if (bearerAuth(ctx)) {
      next()
    }
    return
  }

  let key = 'pub_key'
  const params: IsAuthorizedParams = {
    url,
    publicKey: getPublicKeyFromSource(ctx.query as Record<string, string>, key)
  }

  // pub_key in body
  if (url.includes('group') && !url.includes('group/info')) {
    params.publicKey = getPublicKeyFromSource(ctx.request.body, key)
  }

  // UPLOADCARE_PUB_KEY in body
  if (
    url.includes('base') ||
    url.includes('multipart/start') ||
    url.includes('multipart/complete')
  ) {
    key = 'UPLOADCARE_PUB_KEY'
    params.publicKey = getPublicKeyFromSource(ctx.request.body, key)
  }

  if (isAuthorized(params)) {
    next()
  } else {
    error(ctx, {
      status: 403,
      statusText: params.publicKey
        ? `${key} is invalid.`
        : `${key} is required.`,
      errorCode: 'ProjectPublicKeyInvalidError'
    })
  }
}

export default auth
