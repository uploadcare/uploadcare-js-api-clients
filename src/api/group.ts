import request from './request/request'
import {prepareOptions} from './request/prepareOptions'

/* Types */
import {RequestOptions} from './request/types'
import {GroupInfoInterface, Uuid} from './types'
import {SettingsInterface} from '../types'

const getRequestQuery = (uuids: Uuid[], settings: SettingsInterface) => {
  const query = {
    pub_key: settings.publicKey || '',
    files: uuids,
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

const getRequestOptions = (uuids: Uuid[], settings: SettingsInterface): RequestOptions => {
  return prepareOptions({
    method: 'POST',
    path: '/group/',
    query: getRequestQuery(uuids, settings),
  }, settings)
}

/**
 * Create files group.
 *
 * @param {Uuid[]} uuids – A set of files you want to join in a group.
 * @param {SettingsInterface} settings
 * @return {Promise<GroupInfoInterface>}
 */
export default function group(uuids: Uuid[], settings: SettingsInterface = {}): Promise<GroupInfoInterface> {
  const options = getRequestOptions(uuids, settings)

  return request(options)
    .then(response => response.data)
}
