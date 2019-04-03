import request, {prepareOptions} from './request'
import {Settings} from '../types'
import {RequestOptions} from './request'
import {FileInfo} from './types'

export type Url = string

export enum TypeEnum {
  Token = 'token',
  FileInfo = 'file_info'
}

type TokenResponse = {
  type: TypeEnum.Token,
  token: string,
}

type FileInfoResponse = {
  type: TypeEnum.FileInfo,
} & FileInfo

export type FromUrlResponse = FileInfoResponse | TokenResponse

/**
 * TokenResponse Type Guard
 * @param {FromUrlResponse} response
 */
export const isTokenResponse = (response: FromUrlResponse): response is TokenResponse => {
  return response.type !== undefined && response.type === TypeEnum.Token;
}

/**
 * InfoResponse Type Guard
 * @param {FromUrlResponse} response
 */
export const isFileInfoResponse = (response: FromUrlResponse): response is FileInfoResponse => {
  return response.type !== undefined && response.type === TypeEnum.Token;
}

/**
 * Uploading files from URL.
 *
 * @param {Url} sourceUrl – Source file URL, which should be a public HTTP or HTTPS link.
 * @param {Settings} settings
 * @return {Promise<FromUrlResponse>}
 */
export default function fromUrl(
  sourceUrl: Url, settings: Settings = {}
): Promise<FromUrlResponse> {
  const options: RequestOptions = prepareOptions({
    method: 'POST',
    path: '/from_url/',
    query: {
      pub_key: settings.publicKey || '',
      source_url: sourceUrl,
      store: settings.doNotStore ? '' : 'auto',
      filename: settings.fileName || '',
      check_URL_duplicates: settings.checkForUrlDuplicates ? 1 : 0,
      save_URL_duplicates: settings.saveUrlForRecurrentUploads ? 1 : 0,
      signature: settings.secureSignature || '',
      expire: settings.secureExpire || '',
    },
  }, settings)

  return request(options)
    .then(response => response.data)
}
