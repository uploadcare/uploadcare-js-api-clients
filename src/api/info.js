/* @flow */
import request from './request'
import type {Settings, FileInfo} from '../types'
import type {RequestOptions} from './request'

export type InfoResponse = FileInfo

/**
 * Returns a JSON dictionary holding file info
 *
 * @param {string} uuid – UUID of a target file to request its info.
 * @param {Settings} settings
 * @return {Promise<InfoResponse>}
 */
export default function info(uuid: string, settings: Settings = {}): Promise<InfoResponse> {
  const options: RequestOptions = {
    path: '/info/',
    query: {
      pub_key: settings.publicKey || '',
      file_id: uuid,
    },
  }

  if (settings.baseURL) {
    options.baseURL = settings.baseURL
  }
  if (settings.userAgent) {
    options.userAgent = settings.userAgent
  }

  /* TODO Need to handle errors */
  return request(options)
    .then(response => {
      if (response.ok && typeof response.data.error === 'undefined') {
        return response.data
      }
      else {
        return Promise.reject()
      }
    })
    .catch(() => {
      return Promise.reject()
    })
}
