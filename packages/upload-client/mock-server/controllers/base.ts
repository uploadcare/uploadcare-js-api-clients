import { type Middleware } from 'koa'
import json from '../data/base'
import find from '../utils/find'

/** '/base/' */
const index: Middleware = (ctx) => {
  ctx.body = find(json, 'info')
}

export { index }
