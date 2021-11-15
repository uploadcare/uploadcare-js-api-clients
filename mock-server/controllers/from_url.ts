import jsonIndex from '../data/from_url/index.js'
import jsonStatus from '../data/from_url/status.js'
import find from '../utils/find.js'
import error from '../utils/error.js'

import { PORT } from '../config.js'

/**
 * '/from_url/?pub_key=XXXXXXXXXXXXXXXXXXXX'
 * @param {object} ctx
 */
const index = (ctx) => {
  const isPrivateIP = (url: string): boolean =>
    url.includes('192.168.') ||
    (url.includes('localhost') && !url.includes(`http://localhost:${PORT}/`))
  const doesNotExist = (url: string): boolean => url === 'https://1.com/1.jpg'

  const sourceUrl = ctx.query && ctx.query.source_url
  const checkForUrlDuplicates = !!parseInt(
    ctx.query && ctx.query.check_URL_duplicates
  )
  const saveUrlForRecurrentUploads = !!parseInt(
    ctx.query && ctx.query.save_URL_duplicates
  )

  // Check params
  if (!sourceUrl) {
    error(ctx, {
      statusText: 'source_url is required.'
    })

    return
  }

  if (doesNotExist(sourceUrl)) {
    error(ctx, {
      statusText: 'Host does not exist.'
    })

    return
  }

  if (isPrivateIP(sourceUrl)) {
    error(ctx, {
      statusText: 'Only public IPs are allowed.'
    })

    return
  }

  if (checkForUrlDuplicates === true && saveUrlForRecurrentUploads === true) {
    ctx.body = find(jsonIndex, 'info')
  } else {
    ctx.body = find(jsonIndex, 'token')
  }
}

/**
 * '/from_url/status/?pub_key=XXXXXXXXXXXXXXXXXXXX&token=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
 * @param {object} ctx
 */
const status = (ctx) => {
  const token = ctx.query && ctx.query.token
  const publicKey = ctx.query && ctx.query.publicKey

  if (token) {
    if (publicKey !== 'demopublickey') {
      ctx.body = find(jsonStatus, 'info')
    } else {
      ctx.body = find(jsonStatus, 'progress')
    }
  } else {
    error(ctx, {
      statusText: 'token is required.'
    })
  }
}

export { index, status }
