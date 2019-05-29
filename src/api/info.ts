import request, {prepareOptions} from './request'
import {FileInfo} from './types'
import {Settings} from '../types'
import {RequestOptions} from './request'

export type Uuid = string

export type InfoResponse = FileInfo

const getRequestQuery = (uuid: Uuid, settings: Settings) => {
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

  return  {...query}
}

const getRequestOptions = (uuid: Uuid, settings: Settings): RequestOptions => {
  return prepareOptions({
    path: '/info/',
    query: getRequestQuery(uuid, settings),
  }, settings)
}

/**
 * Returns a JSON dictionary holding file info
 *
 * @param {Uuid} uuid – UUID of a target file to request its info.
 * @param {Settings} settings
 * @return {Promise<InfoResponse>}
 */
export default function info(uuid: Uuid, settings: Settings = {}): Promise<InfoResponse> {
  const options = getRequestOptions(uuid, settings)

  return request(options)
    .then(response => response.data)
}
