import * as json from '../data/info.json'
import find from '../utils/find'

/**
 * '/info?pub_key=XXXXXXXXXXXXXXXXXXXX&file_id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
 * @param {object} ctx
 */
const index = (ctx) => {
  if (ctx.query && ctx.query.file_id) {
    ctx.body = find(json, 'info')
  } else {
    ctx.status = 400
  }
}

export {
  index,
}
