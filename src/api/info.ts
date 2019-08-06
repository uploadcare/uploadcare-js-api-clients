import request from './request/request'
import {prepareOptions} from './request/prepareOptions'

/* Types */
import {RequestOptionsInterface} from './request/types'
import {FileInfoInterface, Uuid} from './types'
import {SettingsInterface} from '../types'
import {CancelableThenable} from '../thenable/CancelableThenable'
import {CancelableThenableInterface} from '../thenable/types'

const getRequestQuery = (uuid: Uuid, settings: SettingsInterface) => {
  const query = {
    pub_key: settings.publicKey || '',
    file_id: uuid,
  }

  if (settings.source) {
    return {
      ...query,
      source: settings.source,
    }
  }

  return query
}

const getRequestOptions = (uuid: Uuid, settings: SettingsInterface): RequestOptionsInterface => {
  return prepareOptions({
    path: '/info/',
    query: getRequestQuery(uuid, settings),
  }, settings)
}

/**
 * Returns a JSON dictionary holding file info.
 *
 * @param {Uuid} uuid – UUID of a target file to request its info.
 * @param {SettingsInterface} settings
 * @return {CancelableThenableInterface<FileInfoInterface>}
 */
export default function info(uuid: Uuid, settings: SettingsInterface = {}): CancelableThenableInterface<FileInfoInterface> {
  const options = getRequestOptions(uuid, settings)

  return new CancelableThenable(options)
}
