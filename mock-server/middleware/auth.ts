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

type IsAuthorizedParams = {
  url: string,
  source: object,
  key?: string,
}
/**
 * Check auth.
 * @param {string} url
 * @param {object} source
 * @param {string} key
 * @return {boolean}
 */
const isAuthorized = ({url, source, key = 'pub_key'}: IsAuthorizedParams) => {
  if (!isProtected(url)) {
    return true
  }

  const publicKey = typeof source[key] !== 'undefined' && source[key]

  return !!(publicKey && ALLOWED_PUBLIC_KEYS.includes(publicKey))
}

/**
 * Uploadcare Auth middleware.
 * @param {object} ctx
 * @param {function} next
 */
const auth = (ctx, next) => {
  let params: IsAuthorizedParams = {
    url: ctx.url.split('?').shift(),
    source: ctx.query,
  }

  if (ctx.url.includes('base')) {
    params.key = 'UPLOADCARE_PUB_KEY'
    params.source = ctx.request.body
  }

  if (isAuthorized(params)) {
    next()
  } else {
    error(ctx, {
      status: 403,
      statusText: `${params.key || 'pub_key'} is required.`,
    })
  }
}

export default auth
