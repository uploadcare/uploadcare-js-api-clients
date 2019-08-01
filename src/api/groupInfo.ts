import request from './request/request'
import {prepareOptions} from './request/prepareOptions'

/* Types */
import {RequestOptionsInterface} from './request/types'
import {GroupInfoInterface, GroupId} from './types'
import {SettingsInterface} from '../types'

const getRequestQuery = (id: GroupId, settings: SettingsInterface) => {
  const query = {
    pub_key: settings.publicKey || '',
    group_id: id,
  }

  if (settings.source) {
    return {
      ...query,
      source: settings.source,
    }
  }

  return query
}

const getRequestOptions = (id: GroupId, settings: SettingsInterface): RequestOptionsInterface => {
  return prepareOptions({
    path: '/group/info/',
    query: getRequestQuery(id, settings),
  }, settings)
}

/**
 * Get info about group.
 *
 * @param {GroupId} id – Group ID. Group IDs look like UUID~N.
 * @param {SettingsInterface} settings
 * @return {Promise<GroupInfoInterface>}
 */
export default function groupInfo(id: GroupId, settings: SettingsInterface = {}): Promise<GroupInfoInterface> {
  const options = getRequestOptions(id, settings)

  return request(options)
    .then(response => response.data)
}
