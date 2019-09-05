import * as json from '../data/base.json'
import find from '../utils/find'

/**
 * '/base/'
 *
 * @param {object} ctx
 */
const index = (ctx): void => {
  ctx.body = find(json, 'info')
}

export {
  index,
}
