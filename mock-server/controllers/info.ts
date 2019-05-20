import * as json from '../data/info.json'
import {find} from '../utils/find'

/**
 * '/info/:uuid'
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
