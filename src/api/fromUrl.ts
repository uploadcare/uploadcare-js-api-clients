import request, {prepareOptions} from './request'
import {Settings} from '../types'
import {RequestOptions} from './request'
import {FileInfo} from './types'

export type UrlData = {
  sourceUrl: string,
  checkForUrlDuplicates?: boolean,
  saveUrlForRecurrentUploads?: boolean
}

type TokenResponse = {
  type: string,
  token: string,
}

type InfoResponse = FileInfo

export type FromUrlResponse = TokenResponse | InfoResponse

/**
 * Uploading files from URL.
 *
 * @param {UrlData} urlData – Source file URL, which should be a public HTTP or HTTPS link.
 * @param {Settings} settings
 * @return {Promise<FromUrlResponse>}
 */
export default function fromUrl(
  {sourceUrl, checkForUrlDuplicates, saveUrlForRecurrentUploads}: UrlData, settings: Settings = {}
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
