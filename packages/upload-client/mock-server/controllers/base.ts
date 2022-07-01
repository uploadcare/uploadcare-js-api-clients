import json from '../data/base'
import find from '../utils/find'

/**
 * '/base/'
 * @param {object} ctx
 */
const index = (ctx) => {
  ctx.body = find(json, 'info')
}

export { index }
