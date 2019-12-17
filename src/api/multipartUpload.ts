import { MultipartPart } from './multipartStart'

import request from './request/request.node'
import { getUserAgent } from '../defaultSettings'
import CancelController from '../CancelController'

export type MultipartUploadOptions = {
  publicKey?: string
  cancel?: CancelController
  onProgress?: ({ value: number }) => void
  integration?: string
  retryThrottledRequestMaxTimes?: number
}

export type MultipartUploadResponse = {
  code?: number
}

/**
 * Complete multipart uploading.
 */
export default function multipartUpload(
  part: Buffer | Blob,
  url: MultipartPart,
  { publicKey, cancel, onProgress, integration }: MultipartUploadOptions
): Promise<MultipartUploadResponse> {
  return request({
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
  }).then(({ status }) => ({ code: status }))
}
