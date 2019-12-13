import { FailedResponse } from './request/types'
import { Uuid } from './types'

import request from './request/request.node'
import getFormData from './request/buildFormData.node'
import getUrl from './request/getUrl'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'
import retryIfThrottled from '../tools/retryIfThrottled'
import { UploadClientError } from '../errors/errors'
import CancelController from '../CancelController'

export type MultipartStartOptions = {
  publicKey: string
  size: number
  contentType: string
  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: boolean
  multipartChunkSize?: number
  cancel?: CancelController
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
}

type MultipartPart = string

export type MultipartStartResponse = {
  parts: MultipartPart[]
  uuid: Uuid
}

type Response = MultipartStartResponse | FailedResponse

/**
 * Start multipart uploading.
 */
export default function multipartStart(
  file: Blob | File | Buffer,
  {
    publicKey,
    contentType = 'application/octet-stream',
    size,
    fileName = defaultSettings.fileName,
    multipartChunkSize = defaultSettings.multipartChunkSize,
    baseURL = '',
    secureSignature,
    secureExpire,
    store,
    cancel,
    source = 'local',
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: MultipartStartOptions
): Promise<MultipartStartResponse> {
  return retryIfThrottled(
    () =>
      request({
        method: 'POST',
        url: getUrl(baseURL, '/multipart/start/'),
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration })
        },
        data: getFormData([
          ['filename', fileName],
          ['size', size],
          ['content_type', contentType],
          ['part_size', multipartChunkSize],
          ['UPLOADCARE_STORE', store ? '' : 'auto'],
          ['UPLOADCARE_PUB_KEY', publicKey],
          ['signature', secureSignature],
          ['expire', secureExpire],
          ['source', source]
        ]),
        cancel
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys<Response>(JSON.parse(data))

        if ('error' in response) {
          throw new UploadClientError(
            `[${response.error.statusCode}] ${response.error.content}`,
            request,
            response.error,
            headers
          )
        } else {
          return response
        }
      }),
    retryThrottledRequestMaxTimes
  )
}
