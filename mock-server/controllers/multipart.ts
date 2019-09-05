import * as multipartJson from '../data/multipart.json'
import * as infoJson from '../data/info.json'
import find from '../utils/find'
import error from '../utils/error'

/**
 * '/multipart/start/'
 * @param {object} ctx
 */
const start = (ctx): void => {
  if (ctx.request.body && !ctx.request.body.filename) {
    return error(ctx, {
      statusText: 'The "filename" parameter is missing.'
    })
  }

  if (ctx.request.body && !ctx.request.body.size) {
    return error(ctx, {
      statusText: 'The provided "size" should be an integer.'
    })
  }

  if (ctx.request.body && ctx.request.body.size && ctx.request.body.size < 10485760) {
    return error(ctx, {
      statusText: 'File size should not be less than 10485760 bytes. Please use direct uploads instead.'
    })
  }

  if (ctx.request.body && !ctx.request.body.content_type) {
    return error(ctx, {
      statusText: 'The "content_type" parameter is missing.'
    })
  }

  ctx.body = find(multipartJson, 'start')
}

/**
 * '/multipart/upload/'
 * @param {object} ctx
 */
const upload = (ctx) => {
  return ctx.status = 200
}

/**
 * '/multipart/complete/'
 * @param {object} ctx
 */
const complete = (ctx): object | void => {
  if (ctx.request.body && !ctx.request.body.uuid) {
    return error(ctx, {
      statusText: 'The "uuid" parameter is missing.'
    })
  }

  return ctx.body = find(infoJson, 'info')
}

export {
  start,
  upload,
  complete,
}
