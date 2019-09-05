import {prepareOptions} from './request/prepareOptions'

/* Types */
import {Query, RequestOptionsInterface} from './request/types'
import {GroupInfoInterface, Uuid} from './types'
import {SettingsInterface} from '../types'
import {CancelableThenable} from '../thenable/CancelableThenable'
import {CancelableThenableInterface} from '../thenable/types'

const getRequestQuery = (uuids: Uuid[], settings: SettingsInterface): Query => {
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

const getRequestOptions = (uuids: Uuid[], settings: SettingsInterface): RequestOptionsInterface => {
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
 * @param {SettingsInterface} settings - Client settings.
 * @return {CancelableThenableInterface<GroupInfoInterface>}
 */
export default function group(uuids: Uuid[], settings: SettingsInterface = {}): CancelableThenableInterface<GroupInfoInterface> {
  const options = getRequestOptions(uuids, settings)

  return new CancelableThenable(options)
}
