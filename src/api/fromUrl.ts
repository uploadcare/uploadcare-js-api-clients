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

export type FromUrlInfoResponse = {
  status?: string,
  type: string,
  size: number,
  total: number,
  done: number,
  uuid: UUID,
  file_id: UUID,
  filename: string,
  original_filename: string,
  is_image: boolean,
  is_stored: boolean,
  image_info: {
    height: number,
    width: number,
    geo_location: null,
    datetime_original: null,
    format: string
  },
  video_info: {},
  is_ready: boolean,
  mime_type: string
}

export type FromUrlResponse = FromUrlTokenResponse | FromUrlInfoResponse

/**
 * Uploading files from URL.
 * @param {FromUrlRequest} fromUrlRequest – Source file URL, which should be a public HTTP or HTTPS link.
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
