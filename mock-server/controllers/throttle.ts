import error from '../utils/error'

let times = 0

/**
 * '/base/'
 * @param {object} ctx
 */
const index = (ctx) => {
  times++;

  console.log(times)

  error(ctx, {
    status: 429,
    statusText: 'Request was throttled.'
  })
}

export {
  index,
}
