import * as json from '../data/info.json'
import {find} from '../utils/find'

/**
 * '/info/:uuid'
 * @param {object} ctx
 */
const uuid = (ctx) => {
  ctx.body = find(json, 'info')
}

export {
  uuid,
}
