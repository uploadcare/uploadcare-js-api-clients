import error from '../utils/error'

let times = 0

/**
 * '/throttle/'
 * @param {object} ctx
 */
const index = (ctx): void => {
  times++

  if (times === 2) {
    times = 0

    ctx.status = 200
  } else {
    error(ctx, {
      status: 429,
      statusText: 'Request was throttled.'
    })
  }
}

export {
  index,
}
