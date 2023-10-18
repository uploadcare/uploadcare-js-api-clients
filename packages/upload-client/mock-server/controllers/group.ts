import json from '../data/group'
import find from '../utils/find'
import error from '../utils/error'

const UUID_REGEX =
  '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
const GROUP_ID_REGEX = `${UUID_REGEX}~[1-9][0-9]*$`

/**
 * Check file UUID.
 *
 * @param {string} uuid
 * @returns {boolean}
 */
const isValidUuid = (uuid: string): boolean => new RegExp(UUID_REGEX).test(uuid)

/**
 * Check group id.
 *
 * @param {string} groupId
 * @returns {boolean}
 */
const isValidGroupId = (groupId: string): boolean =>
  new RegExp(GROUP_ID_REGEX).test(groupId)

/**
 * Get UUID from file
 *
 * @param {string} file
 * @returns {string}
 */
const getFileUuid = (file: string): string => {
  // If file contains CDN operations
  if (file.includes('/')) {
    const array = file.split('/')

    return array[0]
  }

  return file
}

/**
 * Is valid file?
 *
 * @param {string} file
 * @returns {boolean}
 */
const isValidFile = (file: string): boolean => {
  const uuid = getFileUuid(file)

  return isValidUuid(uuid)
}

/**
 * '/group/'
 *
 * @param {object} ctx
 */
const index = (ctx) => {
  let files = ctx.query && ctx.query['files[]']
  const publicKey = ctx.query && ctx.query.pub_key

  if (!files || files.length === 0) {
    return error(ctx, {
      statusText: 'No files[N] parameters found.'
    })
  }

  // If `files` contains only `string` – convert in array
  if (!Array.isArray(files)) {
    files = [files]
  }

  for (const file of files) {
    if (!isValidFile(file)) {
      return error(ctx, {
        statusText: `This is not valid file url: ${file}.`
      })
    }
  }

  if (publicKey === 'demopublickey' && files.length > 0) {
    return error(ctx, {
      statusText: 'Some files not found.'
    })
  }

  const response = find(json, 'info') as (typeof json)['info']
  response.files = files.map((file) => {
    const uuid = file.split('/')[0]
    const effects = file.split('/-/')[1] ?? ''
    return {
      ...response.files[0],
      uuid,
      default_effects: effects.replace(/^-\//, '')
    }
  })
  ctx.body = response
}

/**
 * '/group/info/?pub_key=XXXXXXXXXXXXXXXXXXXX&group_id=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX~N'
 *
 * @param {object} ctx
 */
const info = (ctx) => {
  const groupId = ctx.query && ctx.query.group_id

  if (!groupId) {
    return error(ctx, {
      statusText: 'group_id is required.'
    })
  }

  if (!isValidGroupId(groupId)) {
    return error(ctx, {
      status: 404,
      statusText: 'group_id is invalid.'
    })
  }

  ctx.body = find(json, 'info')
}

export { index, info }
