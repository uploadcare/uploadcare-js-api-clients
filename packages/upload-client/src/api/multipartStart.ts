import { FailedResponse } from '../request/types'
import { Uuid } from './types'
import {
  CustomUserAgent,
  camelizeKeys,
  Metadata
} from '@uploadcare/api-client-utils'

import request from '../request/request.node'
import buildFormData from '../tools/buildFormData'
import getUrl from '../tools/getUrl'
import {
  defaultSettings,
  defaultFilename,
  defaultContentType
} from '../defaultSettings'
import { getUserAgent } from '../tools/getUserAgent'
import { retryIfFailed } from '../tools/retryIfFailed'
import { UploadClientError } from '../tools/errors'
import { getStoreValue } from '../tools/getStoreValue'
import { StoreValue } from '../types'

export type MultipartStartOptions = {
  publicKey: string
  contentType?: string
  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: StoreValue
  multipartChunkSize?: number
  signal?: AbortSignal
  source?: string
  integration?: string
  userAgent?: CustomUserAgent
  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
  metadata?: Metadata
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
    store,
    signal,
    source = 'local',
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,

    metadata
  }: MultipartStartOptions
): Promise<MultipartStartResponse> {
  return retryIfFailed(
    () =>
      request({
        method: 'POST',
        url: getUrl(baseURL, '/multipart/start/', { jsonerrors: 1 }),
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration, userAgent })
        },
        data: buildFormData({
          filename: fileName || defaultFilename,
          size: size,
          content_type: contentType || defaultContentType,
          part_size: multipartChunkSize,
          UPLOADCARE_STORE: getStoreValue(store),
          UPLOADCARE_PUB_KEY: publicKey,
          signature: secureSignature,
          expire: secureExpire,
          source: source,
          metadata
        }),
        signal
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys(JSON.parse(data)) as Response

        if ('error' in response) {
          throw new UploadClientError(
            response.error.content,
            response.error.errorCode,
            request,
            response,
            headers
          )
        } else {
          // convert to array
          response.parts = Object.keys(response.parts).map(
            (key) => response.parts[key]
          )

          return response
        }
      }),
    { retryThrottledRequestMaxTimes, retryNetworkErrorMaxTimes }
  )
}
