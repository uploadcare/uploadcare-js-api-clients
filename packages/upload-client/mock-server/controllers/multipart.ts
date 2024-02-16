import multipartJson from '../data/multipart'
import infoJson from '../data/info'
import find from '../utils/find'
import error from '../utils/error'
import { type Middleware } from 'koa'

/** '/multipart/start/' */
const start: Middleware = (ctx) => {
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

  if (
    ctx.request.body &&
    ctx.request.body.size &&
    ctx.request.body.size < 10485760
  ) {
    return error(ctx, {
      statusText:
        'File size can not be less than 10485760 bytes. Please use direct upload instead of multipart.'
    })
  }

  if (ctx.request.body && !ctx.request.body.content_type) {
    return error(ctx, {
      statusText: 'The "content_type" parameter is missing.'
    })
  }

  ctx.body = find(multipartJson, 'start')
}

/** '/multipart/upload/' */
const upload: Middleware = (ctx) => {
  ctx.status = 200
}

/** '/multipart/complete/' */
const complete: Middleware = (ctx) => {
  if (ctx.request.body && !ctx.request.body.uuid) {
    return error(ctx, {
      statusText: 'uuid is required.'
    })
  }

  // eslint-disable-next-line require-atomic-updates
  ctx.body = find(infoJson, 'info')
}

export { start, upload, complete }
