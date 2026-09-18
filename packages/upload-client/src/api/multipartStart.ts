import { FailedResponse } from '../request/types'
import { Uuid } from './types'
import {
  CustomUserAgent,
  camelizeKeys,
  Metadata,
  StoreValue,
  Tags
} from '@uploadcare/api-client-utils'

import request from '../request/request.node'
import buildFormData from '../tools/buildFormData'
import getUrl from '../tools/getUrl'
import {
  defaultSettings,
  defaultFilename,
  defaultContentType
} from '../defaultSettings'
import { retryIfFailed } from '../tools/retryIfFailed'
import { createUploadError } from '../tools/createUploadError'
import { isAuthTokenResolver } from '../tools/resolveAuthToken'
import { getRequestHeaders } from '../tools/getRequestHeaders'
import { getSecureParams } from '../tools/getSecureParams'
import { getStoreValue } from '../tools/getStoreValue'
import { getTagsValue } from '../tools/getTagsValue'
import { AuthToken } from '../types'

export type MultipartStartOptions = {
  publicKey: string
  contentType?: string
  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  authToken?: AuthToken
  store?: StoreValue
  multipartChunkSize?: number
  signal?: AbortSignal
  source?: string
  integration?: string
  userAgent?: CustomUserAgent
  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
  metadata?: Metadata
  tags?: Tags
}

export type MultipartPart = string

export type MultipartStartResponse = {
  parts: MultipartPart[]
  uuid: Uuid
}

type Response = MultipartStartResponse | FailedResponse

/** Start multipart uploading. */
export default function multipartStart(
  size: number,
  {
    publicKey,
    contentType,
    fileName,
    multipartChunkSize = defaultSettings.multipartChunkSize,
    baseURL = '',
    secureSignature,
    secureExpire,
    authToken,
    store,
    signal,
    source = 'local',
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,

    metadata,
    tags
  }: MultipartStartOptions
): Promise<MultipartStartResponse> {
  return retryIfFailed(
    async () =>
      request({
        method: 'POST',
        url: getUrl(baseURL, '/multipart/start/', { jsonerrors: 1 }),
        headers: await getRequestHeaders({
          publicKey,
          integration,
          userAgent,
          authToken
        }),
        data: buildFormData({
          filename: fileName || defaultFilename,
          size: size,
          content_type: contentType || defaultContentType,
          part_size: multipartChunkSize,
          UPLOADCARE_STORE: getStoreValue(store),
          UPLOADCARE_PUB_KEY: publicKey,
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
          // convert to array
          response.parts = Object.keys(response.parts).map(
            (key) => response.parts[Number(key)]
          )

          return response
        }
      }),
    {
      retryThrottledRequestMaxTimes,
      retryNetworkErrorMaxTimes,
      canRetryExpiredToken: isAuthTokenResolver(authToken)
    }
  )
}
