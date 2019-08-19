import * as json from '../data/info.json'
import find from '../utils/find'
import error from '../utils/error'

/**
 * '/info?pub_key=XXXXXXXXXXXXXXXXXXXX&file_id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
 * @param {object} ctx
 */
const index = (ctx): void => {
  if (ctx.query && ctx.query.file_id) {
    ctx.body = find(json, 'info')
  } else {
    error(ctx, {
      statusText: 'file_id is required.'
    })
  }
}

export {
  index,
}
