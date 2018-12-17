/* @flow */
import request from './request'
import type {Settings} from '../types'
import type {RequestOptions} from './request'

export type FileInfo = {
  [key: string]: string | number | boolean
}

/**
 * Returns a JSON dictionary holding file info
 *
 * @param {string} id – UUID of a target file to request its info.
 * @param {Settings} settings
 * @return {Promise<FileInfo>}
 */
export default function info(id: string, settings: Settings = {}): Promise<FileInfo> {
  const options: RequestOptions = {
    path: '/info/',
    query: {
      pub_key: settings.publicKey || '',
      file_id: id,
    },
  }

  if (settings.baseURL) {
    options.baseURL = settings.baseURL
  }
  if (settings.userAgent) {
    options.userAgent = settings.userAgent
  }

  /* TODO Need to handle errors */
  return new Promise((resolve, reject) => {
    request(options)
      .then(response => {
        if (response.ok && typeof response.data.error === 'undefined') {
          resolve(response.data)
        }
        else {
          reject()
        }
      })
      .catch(() => {
        reject()
      })
  })
}
