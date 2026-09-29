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
  // Part uploads go to presigned storage URLs and must never carry the
  // Authorization header. The client ignores the status code of part PUTs,
  // so drop the connection to make a leaked header fail tests loudly.
  if (ctx.get('Authorization')) {
    ctx.req.destroy()
    return
  }
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
