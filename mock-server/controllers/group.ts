import * as json from '../data/group.json'
import find from '../utils/find'
import error from '../utils/error'

const UUID_REGEX = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
const GROUP_ID_REGEX = `${UUID_REGEX}~[1-9][0-9]*$`

/**
 * '/group/'
 * @param {object} ctx
 */
const index = (ctx) => {
  const files = ctx.query && ctx.query['files[]']
  const publicKey = ctx.query && ctx.query.pub_key

  if (!files || files.length === 0) {
    return error(ctx, {
      statusText: 'no files[N] parameters found.'
    })
  }

  if (files && files.length > 0) {
    for (let key in files) {
      if (files.hasOwnProperty(key)) {
        const file = files[key]
        const array = file.split('/')
        const uuid = array[0]
        const isValidUUID = (new RegExp(UUID_REGEX)).exec(uuid)

        if (!isValidUUID) {
          return error(ctx, {
            statusText: `this is not valid file url: ${file}`
          })
        }
      }
    }
  }

  if (publicKey === 'demopublickey' && files.length > 0) {
    return error(ctx, {
      statusText: 'some files not found.'
    })
  }

  ctx.body = find(json, 'info')
}

/**
 * '/group/info/?pub_key=XXXXXXXXXXXXXXXXXXXX&group_id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX~N'
 * @param {object} ctx
 */
const info = (ctx) => {
  const groupId = ctx.query && ctx.query.group_id

  if (!groupId) {
    return error(ctx, {
      statusText: 'group_id is required.'
    })
  }

  const isValidGroupId = (new RegExp(GROUP_ID_REGEX)).exec(groupId)

  if (!isValidGroupId) {
    return error(ctx, {
      status: 404,
      statusText: 'group_id is invalid.'
    })
  }

  ctx.body = find(json, 'info')
}

export {
  index,
  info,
}
