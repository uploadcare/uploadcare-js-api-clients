import json from '../data/info'
import find from '../utils/find'
import error from '../utils/error'
import { type Middleware } from 'koa'

/** '/info?pub_key=XXXXXXXXXXXXXXXXXXXX&file_id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' */
const index: Middleware = (ctx) => {
  if (ctx.query && ctx.query.file_id) {
    ctx.body = find(json, 'info')
  } else {
    error(ctx, {
      statusText: 'file_id is required.'
    })
  }
}

export { index }
