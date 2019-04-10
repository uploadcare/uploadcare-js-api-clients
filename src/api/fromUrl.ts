import request, {prepareOptions, RequestInterface} from './request'
import {Settings} from '../types'
import {CancelableInterface, FileInfo} from './types'
import {Thenable} from '../tools/Thenable'

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

export interface FromUrlInterface extends Promise<FromUrlResponse>, CancelableInterface {}

class FromUrl extends Thenable<FromUrlResponse> implements FromUrlInterface {
  protected readonly request: RequestInterface
  protected readonly promise: Promise<FromUrlResponse>

  protected readonly sourceUrl: Url
  protected readonly settings: Settings

  constructor(sourceUrl: Url, settings: Settings) {
    super()

    this.sourceUrl = sourceUrl
    this.settings = settings
    this.request = request(this.getRequestOptions())
    this.promise = this.request
      .then(response => response.data)
  }

  protected getRequestOptions() {
    const getRequestQuery = (sourceUrl: Url, settings: Settings) => ({
      pub_key: settings.publicKey || '',
      source_url: sourceUrl,
      store: settings.doNotStore ? '' : 'auto',
      filename: settings.fileName || '',
      check_URL_duplicates: settings.checkForUrlDuplicates ? 1 : 0,
      save_URL_duplicates: settings.saveUrlForRecurrentUploads ? 1 : 0,
      signature: settings.secureSignature || '',
      expire: settings.secureExpire || '',
    })

    return prepareOptions({
      method: 'POST',
      path: '/from_url/',
      query: getRequestQuery(this.sourceUrl, this.settings),
    }, this.settings)
  }

  cancel(): void {
    return this.request.cancel()
  }
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
): FromUrlInterface {
  return new FromUrl(sourceUrl, settings)
}
