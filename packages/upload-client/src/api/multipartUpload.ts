import { MultipartPart } from './multipartStart'

import request from '../request/request.node'

import defaultSettings from '../defaultSettings'
import { retryIfFailed } from '../tools/retryIfFailed'
import { SupportedFileInput } from '../types'
import { ComputableProgressInfo, ProgressCallback } from './types'

export type MultipartUploadOptions = {
  publicKey?: string
  signal?: AbortSignal
  onProgress?: ProgressCallback<ComputableProgressInfo>
  integration?: string
  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
}

export type MultipartUploadResponse = {
  code?: number
}

/**
 * Complete multipart uploading.
 */

export default function multipartUpload(
  part: SupportedFileInput,
  url: MultipartPart,
  {
    signal,
    onProgress,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes
  }: MultipartUploadOptions
): Promise<MultipartUploadResponse> {
  return retryIfFailed(
    () =>
      request({
        method: 'PUT',
        url,
        data: part,
        // Upload request can't be non-computable because we always know exact size
        onProgress: onProgress as ProgressCallback,
        signal
      })
        .then((result) => {
          // hack for node ¯\_(ツ)_/¯
          if (onProgress)
            onProgress({
              isComputable: true,
              value: 1
            })

          return result
        })
        .then(({ status }) => ({ code: status })),
    {
      retryThrottledRequestMaxTimes,
      retryNetworkErrorMaxTimes
    }
  )
}
