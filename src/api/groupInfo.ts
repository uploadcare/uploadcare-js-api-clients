import {prepareOptions} from './request/prepareOptions'

/* Types */
import {Query, RequestOptionsInterface} from './request/types'
import {GroupInfoInterface, GroupId} from './types'
import {SettingsInterface} from '../types'
import {CancelableThenable} from '../thenable/CancelableThenable'
import {CancelableThenableInterface} from '../thenable/types'
import {CancelHookInterface} from '../lifecycle/types'

const getRequestQuery = (id: GroupId, settings: SettingsInterface): Query => {
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
 * @param hooks
 * @return {CancelableThenableInterface<GroupInfoInterface>}
 */
export default function groupInfo(
  id: GroupId,
  settings: SettingsInterface = {},
  hooks?: CancelHookInterface,
): CancelableThenableInterface<GroupInfoInterface> {
  const options = getRequestOptions(id, settings)

  return new CancelableThenable(options, hooks)
}
