import { FailedResponse } from './request/types'
import { Uuid } from './types'

import request from './request/request.node'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'
import retryIfThrottled from '../tools/retryIfThrottled'
import { UploadClientError } from '../errors/errors'
import CancelController from '../CancelController'

export type MultipartCompleteOptions = {
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
export default function multipartComplete(
  partUrl: Uuid,
  part: Buffer,
  {
    publicKey,
    cancel,
    onProgress,
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: MultipartCompleteOptions
): Promise<MultipartUploadResponse> {
  return retryIfThrottled(
    () =>
      request({
        method: 'PUT',
        url: partUrl,
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
