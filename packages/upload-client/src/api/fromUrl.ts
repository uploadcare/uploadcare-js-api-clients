import { FileInfo, Url } from './types'
import { FailedResponse } from '../request/types'
import {
  CustomUserAgent,
  camelizeKeys,
  Metadata,
  StoreValue
} from '@uploadcare/api-client-utils'

import request from '../request/request.node'
import getUrl from '../tools/getUrl'

import defaultSettings from '../defaultSettings'
import { getUserAgent } from '../tools/getUserAgent'
import { UploadError } from '../tools/UploadError'
import { retryIfFailed } from '../tools/retryIfFailed'
import { getStoreValue } from '../tools/getStoreValue'

export enum TypeEnum {
  Token = 'token',
  FileInfo = 'file_info'
}

export type TokenResponse = {
  type: TypeEnum.Token
  token: string
}

export type FileInfoResponse = {
  type: TypeEnum.FileInfo
} & FileInfo

export type FromUrlSuccessResponse = FileInfoResponse | TokenResponse

type Response = FailedResponse | FromUrlSuccessResponse

export type FromUrlResponse = FromUrlSuccessResponse

/** TokenResponse Type Guard. */
export const isTokenResponse = (
  response: FromUrlSuccessResponse
): response is TokenResponse => {
  return response.type !== undefined && response.type === TypeEnum.Token
}

/** FileInfoResponse Type Guard. */
export const isFileInfoResponse = (
  response: FromUrlSuccessResponse
): response is FileInfoResponse => {
  return response.type !== undefined && response.type === TypeEnum.FileInfo
}

export type FromUrlOptions = {
  publicKey: string

  baseURL?: string
  store?: StoreValue
  fileName?: string
  checkForUrlDuplicates?: boolean
  saveUrlForRecurrentUploads?: boolean
  secureSignature?: string
  secureExpire?: string

  signal?: AbortSignal

  source?: string
  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
  metadata?: Metadata
}

/** Uploading files from URL. */
export default function fromUrl(
  sourceUrl: Url,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    store,
    fileName,
    checkForUrlDuplicates,
    saveUrlForRecurrentUploads,
    secureSignature,
    secureExpire,
    source = 'url',
    signal,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
    metadata
  }: FromUrlOptions
): Promise<FromUrlSuccessResponse> {
  return retryIfFailed(
    () =>
      request({
        method: 'POST',
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration, userAgent })
        },
        url: getUrl(baseURL, '/from_url/', {
          jsonerrors: 1,
          pub_key: publicKey,
          source_url: sourceUrl,
          store: getStoreValue(store),
          filename: fileName,
          check_URL_duplicates: checkForUrlDuplicates ? 1 : undefined,
          save_URL_duplicates: saveUrlForRecurrentUploads ? 1 : undefined,
          signature: secureSignature,
          expire: secureExpire,
          source: source,
          metadata
        }),
        signal
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys(JSON.parse(data)) as Response

        if ('error' in response) {
          throw new UploadError(
            response.error.content,
            response.error.errorCode,
            request,
            response,
            headers
          )
        } else {
          return response
        }
      }),
    { retryNetworkErrorMaxTimes, retryThrottledRequestMaxTimes }
  )
}
