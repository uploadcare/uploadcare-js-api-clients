import request, {prepareOptions} from './request'
import {RequestOptions} from './request'
import {Settings} from '../types'
import {InfoResponse} from './info'

export type FromUrlStatusProgressResponse = {
  status: string,
  done: number,
  total: number,
}

export type FromUrlStatusResponse = FromUrlStatusProgressResponse | InfoResponse

/**
 * Checking upload status and working with file tokens.
 *
 * @param {string} token – Source file URL, which should be a public HTTP or HTTPS link.
 * @param {Settings} settings
 * @throws {UploadcareError}
 * @return {Promise<FromUrlStatusResponse>}
 */
export default function fromUrlStatus(token: string, settings: Settings = {}): Promise<FromUrlStatusResponse> {
  const options: RequestOptions = prepareOptions({
    path: '/from_url/status/',
    query: {token: token},
  }, settings)

  // TODO: Fix ts-ignore
  // @ts-ignore
  return request(options)
    .then(response => response.data)
}
