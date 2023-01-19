import { MultipartPart } from './multipartStart'

import request from '../request/request.node'

import defaultSettings, { defaultContentType } from '../defaultSettings'
import { retryIfFailed } from '../tools/retryIfFailed'
import { SupportedFileInput } from '../types'
import { ComputableProgressInfo, ProgressCallback } from './types'

export type MultipartUploadOptions = {
  publicKey?: string
  contentType?: string
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
    contentType,
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
        signal,
        headers: {
          'Content-Type': contentType || defaultContentType
        }
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
