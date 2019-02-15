import request, {prepareOptions} from './request'
import {Settings, UUID} from '../types'
import {RequestOptions} from './request'

export type FromUrlRequest = {
  sourceUrl: string,
  checkForUrlDuplicates?: boolean,
  saveUrlForRecurrentUploads?: boolean
}

export type FromUrlTokenResponse = {
  type: string,
  token: UUID
}

export type FromUrlResponse = FromUrlTokenResponse

/**
 * Uploading files from URL.
 * @param {FromUrlRequest} data – Source file URL, which should be a public HTTP or HTTPS link.
 * @param {Settings} settings
 * @return {Promise<FromUrlResponse>}
 */
export default function fromUrl(
  {sourceUrl, checkForUrlDuplicates, saveUrlForRecurrentUploads}: FromUrlRequest,
  settings: Settings = {}
): Promise<FromUrlResponse> {
  const options: RequestOptions = prepareOptions({
    path: '/from_url/',
    query: {
      pub_key: settings.publicKey || '',
      source_url: sourceUrl,
      store: settings.doNotStore ? settings.doNotStore : true,
      filename: settings.fileName || '',
      check_URL_duplicates: checkForUrlDuplicates ? 1 : 0,
      save_URL_duplicates: saveUrlForRecurrentUploads ? 1 : 0,
      signature: settings.secureSignature || '',
      expire: settings.secureExpire || '',
    },
  }, settings)

  // TODO: Fix ts-ignore
  // @ts-ignore
  return request(options)
    .then(response => response.data)
}
