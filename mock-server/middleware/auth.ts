import {ROUTES, RouteType} from '../routes'
import {ALLOWED_PUBLIC_KEYS} from '../config'
import error from '../utils/error'

/**
 * Routes protected by auth.
 */
const protectedRoutes: Array<string> = ROUTES
  .filter((route: RouteType) => {
    const path = Object.keys(route).shift()

    return route[path].isProtected
  })
  .map((route: RouteType) => {
    return Object.keys(route).shift()
  })

/**
 * Check is url protected by auth.
 * @param {string} url
 * @return {boolean}
 */
const isProtected = (url: string) => !!protectedRoutes.filter((path: string) => url === path).length

/**
 * Get public key value from request.
 * @param {object} source
 * @param {string} key
 */
const getPublicKeyFromSource = (source: object, key: string): string => {
  return typeof source[key] !== 'undefined' && source[key]
}

type IsAuthorizedParams = {
  url: string,
  publicKey: string,
}
/**
 * Check auth.
 * @param {string} url
 * @param {object} publicKey
 * @return {boolean}
 */
const isAuthorized = ({url, publicKey}: IsAuthorizedParams) => {
  if (!isProtected(url)) {
    return true
  }

  return !!(publicKey && ALLOWED_PUBLIC_KEYS.includes(publicKey))
}

/**
 * Uploadcare Auth middleware.
 * @param {object} ctx
 * @param {function} next
 */
const auth = (ctx, next) => {
  const urlWithSlash = ctx.url.split('?').shift()
  const url = urlWithSlash.substring(0, urlWithSlash.length-1)

  let key = 'pub_key'
  let params: IsAuthorizedParams = {
    url,
    publicKey: getPublicKeyFromSource(ctx.query, key),
  }

  if (url.includes('base')) {
    key = 'UPLOADCARE_PUB_KEY'
    params.publicKey = getPublicKeyFromSource(ctx.request.body, key)
  }

  if (isAuthorized(params)) {
    next()
  } else {
    error(ctx, {
      status: 403,
      statusText: params.publicKey ? `${key} is invalid.` : `${key} is required.`,
    })
  }
}

export default auth
