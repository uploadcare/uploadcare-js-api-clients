import {
  camelizeKeys,
  CustomUserAgent,
  Metadata,
  StoreValue
} from '@uploadcare/api-client-utils'
import { defaultSettings } from '../defaultSettings'
import request from '../request/request.node'
import buildFormData from '../tools/buildFormData'
import { UploadClientError } from '../tools/errors'
import getUrl from '../tools/getUrl'
import { getUserAgent } from '../tools/getUserAgent'
import { retryIfFailed } from '../tools/retryIfFailed'

/* Types */
import { FailedResponse } from '../request/types'
import { getContentType } from '../tools/getContentType'
import { getFileName } from '../tools/getFileName'
import { getStoreValue } from '../tools/getStoreValue'
import { SupportedFileInput } from '../types'
import { ProgressCallback, Uuid } from './types'

export type BaseResponse = {
  file: Uuid
}

type Response = BaseResponse | FailedResponse

export type BaseOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: StoreValue
  contentType?: string

  signal?: AbortSignal
  onProgress?: ProgressCallback

  source?: string
  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
  metadata?: Metadata
}

/**
 * Performs file uploading request to Uploadcare Upload API. Can be canceled and
 * has progress.
 */
export default function base(
  file: SupportedFileInput,
  {
    publicKey,
    fileName,
    contentType,
    baseURL = defaultSettings.baseURL,
    secureSignature,
    secureExpire,
    store,
    signal,
    onProgress,
    source = 'local',
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
    metadata
  }: BaseOptions
): Promise<BaseResponse> {
  return retryIfFailed(
    () =>
      request({
        method: 'POST',
        url: getUrl(baseURL, '/base/', {
          jsonerrors: 1
        }),
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration, userAgent })
        },
        data: buildFormData({
          file: {
            data: file,
            name: fileName || getFileName(file),
            contentType: contentType || getContentType(file)
          },
          UPLOADCARE_PUB_KEY: publicKey,
          UPLOADCARE_STORE: getStoreValue(store),
          signature: secureSignature,
          expire: secureExpire,
          source: source,
          metadata
        }),
        signal,
        onProgress
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
          return response
        }
      }),
    { retryNetworkErrorMaxTimes, retryThrottledRequestMaxTimes }
  )
}
