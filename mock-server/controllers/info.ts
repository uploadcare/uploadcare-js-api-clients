import * as json from '../data/info.json'
import {find} from '../utils/find'

/**
 * '/info?uuid=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
 * '/info?file_id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
 * @param {object} ctx
 */
const uuid = (ctx) => {
  if (ctx.query && ctx.query.file_id || ctx.query.uuid) {
    ctx.body = find(json, 'info')
  } else {
    ctx.status = 400
  }
}

export {
  uuid,
}
