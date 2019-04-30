import request, {prepareOptions} from './request'
import {FileInfo} from './types'
import {Settings} from '../types'
import {RequestOptions} from './request'

export type InfoResponse = FileInfo

const getRequestQuery = (uuid: string, settings: Settings) => ({
  pub_key: settings.publicKey || '',
  file_id: uuid,
})

const getRequestOptions = (uuid: string, settings: Settings): RequestOptions => {
  return prepareOptions({
    path: '/info/',
    query: getRequestQuery(uuid, settings),
  }, settings)
}

/**
 * Returns a JSON dictionary holding file info
 *
 * @param {string} uuid – UUID of a target file to request its info.
 * @param {Settings} settings
 * @return {Promise<InfoResponse>}
 */
export default function info(uuid: string, settings: Settings = {}): Promise<InfoResponse> {
  const options = getRequestOptions(uuid, settings)

  return request(options)
    .then(response => response.data)
}
