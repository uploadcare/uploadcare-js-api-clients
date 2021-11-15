import { MultipartPart } from './multipartStart'

import request from '../request/request.node'

import { ProgressCallback } from './types'
import { NodeFile, BrowserFile } from '../request/types'

export type MultipartUploadOptions = {
  publicKey?: string
  signal?: AbortSignal
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
  part: NodeFile | BrowserFile,
  url: MultipartPart,
  { signal, onProgress }: MultipartUploadOptions
): Promise<MultipartUploadResponse> {
  return request({
    method: 'PUT',
    url,
    data: part,
    onProgress,
    signal
  })
    .then((result) => {
      // hack for node ¯\_(ツ)_/¯
      if (onProgress) onProgress({ value: 1 })

      return result
    })
    .then(({ status }) => ({ code: status }))
}
