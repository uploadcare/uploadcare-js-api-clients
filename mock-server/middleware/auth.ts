const {ALLOWED_PUBLIC_KEYS, PROTECTED_ROUTES} = require('../config')

/**
 * Check is url protected by auth.
 * @param url
 */
const isProtected = (url: string) => PROTECTED_ROUTES.filter((path: string) => url.startsWith(path))

type IsAuthorizedParams = {
  url: string,
  source: object,
  key?: string,
}
/**
 * Check auth.
 * @param url
 * @param source
 * @param key
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
    url: ctx.url,
    source: ctx.query,
  }

  if (ctx.url === 'base') {
    params.key = 'UPLOADCARE_PUB_KEY'
    params.source = ctx.request.multipart.fields
  }

  if (isAuthorized(params)) {
    next()
  } else {
    ctx.status = 401
  }
}

export default auth
