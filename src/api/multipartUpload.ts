import { MultipartPart } from './multipartStart'

import request from '../request/request.node'
import { getUserAgent } from '../tools/userAgent'

import { ProgressCallback } from './types'
import { NodeFile, BrowserFile } from '../request/types'

export type MultipartUploadOptions = {
  publicKey?: string
  signal?: AbortSignal
  onProgress?: ProgressCallback
  integration?: string
  retryThrottledRequestMaxTimes?: number
}

export type MultipartUploadResponse = {
  code?: number
}

/**
 * Complete multipart uploading.
 */
function multipartUpload(
  part: NodeFile | BrowserFile,
  url: MultipartPart,
  { publicKey, signal, onProgress, integration }: MultipartUploadOptions
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
    signal
  })
    .then(result => {
      // hack for node ¯\_(ツ)_/¯
      if (onProgress) onProgress({ value: 1 })

      return result
    })
    .then(({ status }) => ({ code: status }))
}

export default multipartUpload
