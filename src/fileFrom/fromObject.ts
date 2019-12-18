import base from '../api/base'
import info from '../api/info'
import { poll } from '../tools/poller'
import { UploadcareFile } from '../UploadcareFile'
import CancelController from '../CancelController'
import { isMultipart } from '../multipart/isMultipart'
import multipart from '../multipart/multipart'
import { isNode } from '../tools/isNode'

/* Types */
import { FileData, FileInfo } from '../api/types'

type FromObjectOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: boolean

  cancel?: CancelController
  onProgress?: ({ value: number }) => void

  source?: string
  integration?: string

  retryThrottledRequestMaxTimes?: number

  contentType: string
  multipartChunkSize: number

  baseCDN?: string
}

const fromObject = (
  file: FileData,
  {
    publicKey,

    fileName,
    baseURL,
    secureSignature,
    secureExpire,
    store,

    cancel,
    onProgress,

    source,
    integration,

    retryThrottledRequestMaxTimes,

    contentType,
    multipartChunkSize,

    baseCDN
  }: FromObjectOptions
): Promise<UploadcareFile> => {
  let progress: number
  let upload: Promise<FileInfo>
  const onProgressCallback = ({ value }): void => {
    progress = value * 0.98
    onProgress && onProgress({ value: progress })
  }

  if (isMultipart(file, multipartChunkSize)) {
    upload = multipart(isNode() ? (file as Buffer) : (file as Blob), {
      publicKey,
      contentType,
      multipartChunkSize,
      fileName,
      baseURL,
      secureSignature,
      secureExpire,
      store,
      cancel,
      onProgress,
      source,
      integration,
      retryThrottledRequestMaxTimes
    })
  } else {
    upload = base(file, {
      publicKey,
      fileName,
      baseURL,
      secureSignature,
      secureExpire,
      store,
      cancel,
      onProgress: onProgressCallback,
      source,
      integration,
      retryThrottledRequestMaxTimes
    }).then(({ file }) => {
      return poll<FileInfo>({
        check: async cancel => {
          const response = await info(file, {
            publicKey,
            baseURL,
            cancel,
            source,
            integration,
            retryThrottledRequestMaxTimes
          })

          if (response.isReady) {
            onProgress && onProgress({ value: 1 })

            return response
          }

          if (onProgress) {
            const { done, total } = response

            onProgress({
              value: progress + (done / total) * 0.02
            })
          }

          return false
        }
      })
    })
  }

  return upload.then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))
}

export default fromObject
