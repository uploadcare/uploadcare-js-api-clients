import error from '../utils/error'
import { type Middleware } from 'koa'

let times = 0

/** '/throttle/' */
const index: Middleware = (ctx) => {
  times++

  if (times === 2) {
    times = 0

    return (ctx.status = 200)
  } else {
    return error(ctx, {
      status: 429,
      statusText: 'Request was throttled.'
    })
  }
}

export { index }
