import request, {prepareOptions} from './request'
import {GroupInfo, GroupId} from './types'
import {Settings} from '../types'
import {RequestOptions} from './request'

export type GroupInfoResponse = GroupInfo

const getRequestQuery = (id: GroupId, settings: Settings) => {
  const body = {
    pub_key: settings.publicKey || '',
    group_id: id,
  }

  if (settings.source) {
    return {
      ...body,
      source: settings.source,
    }
  }

  return  {...body}
}

const getRequestOptions = (id: GroupId, settings: Settings): RequestOptions => {
  return prepareOptions({
    path: '/group/info/',
    body: getRequestQuery(id, settings),
  }, settings)
}

/**
 * Create files group
 *
 * @param {GroupId} id – Group ID. Group IDs look like UUID~N.
 * @param {Settings} settings
 * @return {Promise<GroupInfoResponse>}
 */
export default function groupInfo(id: GroupId, settings: Settings = {}): Promise<GroupInfoResponse> {
  const options = getRequestOptions(id, settings)

  return request(options)
    .then(response => response.data)
}
