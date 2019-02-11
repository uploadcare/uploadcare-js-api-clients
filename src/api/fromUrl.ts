import request, {prepareOptions} from './request'
import {Settings} from '../types'
import {RequestOptions} from './request'

export type FromUrlResponse = {
  token: string
}

/**
 * Uploading files from URL.
 *
 * @param {string} sourceUrl – Source file URL, which should be a public HTTP or HTTPS link.
 * @param {Settings} settings
 * @return {Promise<FromUrlResponse>}
 */
export default function fromUrl(sourceUrl: string, settings: Settings = {}): Promise<FromUrlResponse> {
  const options: RequestOptions = prepareOptions({
    path: '/from_url/',
    query: {
      pub_key: settings.publicKey || '',
      source_url: sourceUrl,
    },
  }, settings)

  // TODO: Fix ts-ignore
  // @ts-ignore
  return request(options)
    .then(response => response.data)
}
