import {prepareOptions} from './request/prepareOptions'

/* Types */
import {RequestOptionsInterface} from './request/types'
import {SettingsInterface} from '../types'
import {FileInfoInterface} from './types'
import {CancelableThenable} from '../thenable/CancelableThenable'
import {CancelableThenableInterface} from '../thenable/types'

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
} & FileInfoInterface

export type FromUrlResponse = FileInfoResponse | TokenResponse

/**
 * TokenResponse Type Guard.
 *
 * @param {FromUrlResponse} response
 */
export const isTokenResponse = (response: FromUrlResponse): response is TokenResponse => {
  return response.type !== undefined && response.type === TypeEnum.Token;
}

/**
 * InfoResponse Type Guard.
 *
 * @param {FromUrlResponse} response
 */
export const isFileInfoResponse = (response: FromUrlResponse): response is FileInfoResponse => {
  return response.type !== undefined && response.type === TypeEnum.FileInfo;
}

const getRequestQuery = (sourceUrl: Url, settings: SettingsInterface) => ({
  pub_key: settings.publicKey || '',
  source_url: sourceUrl,
  store: settings.doNotStore ? '' : 'auto',
  filename: settings.fileName || '',
  check_URL_duplicates: settings.checkForUrlDuplicates ? 1 : 0,
  save_URL_duplicates: settings.saveUrlForRecurrentUploads ? 1 : 0,
  signature: settings.secureSignature || '',
  expire: settings.secureExpire || '',
  source: settings.source || 'url',
})

const getRequestOptions = (sourceUrl: Url, settings: SettingsInterface): RequestOptionsInterface => {
  return prepareOptions({
    method: 'POST',
    path: '/from_url/',
    query: getRequestQuery(sourceUrl, settings),
  }, settings)
}

/**
 * Uploading files from URL.
 *
 * @param {Url} sourceUrl – Source file URL, which should be a public HTTP or HTTPS link.
 * @param {SettingsInterface} settings
 * @return {CancelableThenableInterface<FromUrlResponse>}
 */
export default function fromUrl(
  sourceUrl: Url, settings: SettingsInterface = {}
): CancelableThenableInterface<FromUrlResponse> {
  const options = getRequestOptions(sourceUrl, settings)

  return new CancelableThenable(options)
}
