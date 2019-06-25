import request, {prepareOptions} from './request'
import {GroupInfo, Uuid} from './types'
import {Settings} from '../types'
import {RequestOptions} from './request'

export type GroupInfoResponse = GroupInfo

const getRequestBody = (files: Array<Uuid>, settings: Settings) => {
  const body = {
    pub_key: settings.publicKey || undefined,
    files,
    callback: settings.jsonpCallback || undefined,
    signature: settings.secureSignature || undefined,
    expire: settings.secureExpire || undefined,
  }

  if (settings.source) {
    return {
      ...body,
      source: settings.source,
    }
  }

  return  {...body}
}

const getRequestOptions = (files: Array<Uuid>, settings: Settings): RequestOptions => {
  return prepareOptions({
    method: 'POST',
    path: '/group/',
    body: getRequestBody(files, settings),
  }, settings)
}

/**
 * Create files group
 *
 * @param {Array<Uuid>} files – A set of files you want to join in a group.
 * @param {Settings} settings
 * @return {Promise<GroupInfoResponse>}
 */
export default function group(files: Array<Uuid>, settings: Settings = {}): Promise<GroupInfoResponse> {
  const options = getRequestOptions(files, settings)

  return request(options)
    .then(response => response.data)
}
