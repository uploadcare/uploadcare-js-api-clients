import { FileInfo, Url } from './types'
import { FailedResponse } from '../request/types'
import {
  CustomUserAgent,
  camelizeKeys,
  Metadata,
  StoreValue,
  Tags
} from '@uploadcare/api-client-utils'

import request from '../request/request.node'
import getUrl from '../tools/getUrl'

import defaultSettings from '../defaultSettings'
import { createUploadError } from '../tools/createUploadError'
import { retryIfFailed } from '../tools/retryIfFailed'
import { isAuthTokenResolver } from '../tools/resolveAuthToken'
import { getRequestHeaders } from '../tools/getRequestHeaders'
import { getSecureParams } from '../tools/getSecureParams'
import { getStoreValue } from '../tools/getStoreValue'
import { getTagsValue } from '../tools/getTagsValue'
import { AuthToken } from '../types'

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
  authToken?: AuthToken

  signal?: AbortSignal

  source?: string
  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
  metadata?: Metadata
  tags?: Tags
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
    authToken,
    source = 'url',
    signal,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
    metadata,
    tags
  }: FromUrlOptions
): Promise<FromUrlSuccessResponse> {
  return retryIfFailed(
    async () =>
      request({
        method: 'POST',
        headers: await getRequestHeaders({
          publicKey,
          integration,
          userAgent,
          authToken
        }),
        url: getUrl(baseURL, '/from_url/', {
          jsonerrors: 1,
          pub_key: publicKey,
          source_url: sourceUrl,
          store: getStoreValue(store),
          filename: fileName,
          check_URL_duplicates: checkForUrlDuplicates ? 1 : undefined,
          save_URL_duplicates: saveUrlForRecurrentUploads ? 1 : undefined,
          ...getSecureParams({ authToken, secureSignature, secureExpire }),
          source: source,
          metadata,
          tags: getTagsValue(tags)
        }),
        signal
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys<Response>(JSON.parse(data))

        if ('error' in response) {
          throw createUploadError(
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
    {
      retryNetworkErrorMaxTimes,
      retryThrottledRequestMaxTimes,
      canRetryExpiredToken: isAuthTokenResolver(authToken)
    }
  )
}
