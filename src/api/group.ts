import request, {prepareOptions} from './request'
import {GroupInfo, Uuid} from './types'
import {Settings} from '../types'
import {RequestOptions} from './request'

export type GroupInfoResponse = GroupInfo

const getRequestQuery = (files: Uuid[], settings: Settings) => {
  const query = {
    pub_key: settings.publicKey || '',
    files,
    callback: settings.jsonpCallback || undefined,
    signature: settings.secureSignature || undefined,
    expire: settings.secureExpire || undefined,
  }

  if (settings.source) {
    return {
      ...query,
      source: settings.source,
    }
  }

  return  {...query}
}

const getRequestOptions = (files: Uuid[], settings: Settings): RequestOptions => {
  return prepareOptions({
    method: 'POST',
    path: '/group/',
    query: getRequestQuery(files, settings),
  }, settings)
}

/**
 * Create files group
 *
 * @param {Uuid[]} files – A set of files you want to join in a group.
 * @param {Settings} settings
 * @return {Promise<GroupInfoResponse>}
 */
export default function group(files: Uuid[], settings: Settings = {}): Promise<GroupInfoResponse> {
  const options = getRequestOptions(files, settings)

  return request(options)
    .then(response => response.data)
}
