import { FailedResponse } from './request/types'
import { MultipartPart } from './multipartStart'

import request from './request/request.node'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'
import retryIfThrottled from '../tools/retryIfThrottled'
import { UploadClientError } from '../errors/errors'
import CancelController from '../CancelController'

export type MultipartUploadOptions = {
  publicKey?: string
  cancel?: CancelController
  onProgress?: (value: number) => void
  integration?: string
  retryThrottledRequestMaxTimes?: number
}

export type MultipartUploadResponse = {
  code: number
}

type Response = FailedResponse | MultipartUploadResponse

/**
 * Complete multipart uploading.
 */
export default function multipartUpload(
  part: Buffer,
  url: MultipartPart,
  {
    publicKey,
    cancel,
    onProgress,
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: MultipartUploadOptions
): Promise<MultipartUploadResponse> {
  return retryIfThrottled(
    () =>
      request({
        method: 'PUT',
        url,
        headers: {
          'X-UC-User-Agent': publicKey
            ? getUserAgent({ publicKey, integration })
            : undefined
        },
        data: part,
        onProgress,
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
