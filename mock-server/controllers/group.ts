import * as json from '../data/group.json'
import find from '../utils/find'
import error from '../utils/error'

/**
 * '/group/'
 * @param {object} ctx
 */
const index = (ctx) => {
  ctx.body = find(json, 'info')
}

/**
 * '/group/info/?pub_key=XXXXXXXXXXXXXXXXXXXX&group_id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX~N'
 * @param {object} ctx
 */
const info = (ctx) => {
  ctx.body = find(json, 'info')
}

export {
  index,
  info,
}
