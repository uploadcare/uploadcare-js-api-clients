import { ROUTES, RouteType } from '../routes'
import { ALLOWED_PUBLIC_KEYS, SIGNED_UPLOADS_PUBLIC_KEY } from '../config'
import error from '../utils/error'
import { verifyAuthToken } from '../utils/verifyAuthToken'
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

/**
 * Bearer token auth. Runs before the pub_key check whenever the header is
 * present, so tests can prove the header actually reached the server (an
 * invalid pub_key + valid JWT must succeed, an invalid JWT must fail even with
 * a valid pub_key). Rejects requests carrying both auth schemes to lock in the
 * client-side precedence rule (header wins, signature params dropped).
 *
 * The token itself is verified for real by `verifyAuthToken`, so the same tests
 * can run against this server and against the Upload API.
 */
const bearerAuth = (ctx: Parameters<Middleware>[0], path: string): boolean => {
  const authHeader = ctx.get('Authorization')

  // Both parameters, not just `signature`: the client drops the pair together,
  // so a request carrying either one alongside a Bearer token means something
  // leaked, and the mock has to fail loudly for the test to catch it.
  const hasLegacyParam = ['signature', 'expire'].some(
    (name) => ctx.query[name] || (ctx.request.body && ctx.request.body[name])
  )
  if (hasLegacyParam) {
    // A constant message. Naming the offending parameter would put a
    // request-derived value into the response body, which is worth avoiding
    // even in a mock and which Snyk flags as XSS.
    error(ctx, {
      status: 403,
      statusText:
        'Do not use `signature` or `expire` together with a Bearer token.',
      errorCode: 'AccessTokenInvalidError'
    })
    return false
  }

  if (!authHeader.startsWith('Bearer ')) {
    error(ctx, {
      status: 403,
      statusText: 'Invalid Authorization header format.',
      errorCode: 'AccessTokenInvalidError'
    })
    return false
  }

  const rejection = verifyAuthToken(authHeader.slice('Bearer '.length), path)
  if (rejection) {
    error(ctx, { status: 403, ...rejection })
    return false
  }

  return true
}

/** Uploadcare Auth middleware. */
const auth: Middleware = (ctx, next) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const urlWithSlash = ctx.url.split('?').shift()!
  const url = urlWithSlash.substring(0, urlWithSlash.length - 1)

  // Keyed off the header, not `isProtected`. A real server validates a token
  // wherever one is sent, and the client sends it on unprotected routes too,
  // such as the `/from_url/status` poller. Gating on `isProtected` meant those
  // requests were never checked and an expired token sailed through.
  if (ctx.get('Authorization')) {
    if (bearerAuth(ctx, urlWithSlash)) {
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

  // The stand-in for a project with Signed Uploads on: no credential, no
  // upload, whatever the endpoint. Mirrors what the real project the
  // integration tests run against does.
  if (params.publicKey === SIGNED_UPLOADS_PUBLIC_KEY) {
    error(ctx, {
      status: 403,
      statusText: '`signature` is required.',
      errorCode: 'SignatureRequiredError'
    })
    return
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
