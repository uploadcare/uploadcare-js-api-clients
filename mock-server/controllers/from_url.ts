import * as jsonIndex from '../data/from_url/index.json'
import * as jsonStatus from '../data/from_url/status.json'
import {find} from '../utils/find'

/**
 * '/from_url/'
 * @param {object} ctx
 */
const index = (ctx) => {
  ctx.body = find(jsonIndex, 'token')
}

/**
 * '/from_url/status/'
 * @param {object} ctx
 */
const status = (ctx) => {
  ctx.body = find(jsonStatus, 'progress')
}

export {
  index,
  status,
}
