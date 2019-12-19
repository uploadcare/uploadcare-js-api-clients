import base from '../api/base'
import info from '../api/info'
import { poll } from '../tools/poll'
import { UploadcareFile } from '../tools/UploadcareFile'
import CancelController from '../tools/CancelController'
import { isMultipart } from '../multipart/isMultipart'
import multipart from '../multipart/multipart'
import { isNode } from '../tools/isNode'

/* Types */
import { FileInfo } from '../api/types'
import { NodeFile, BrowserFile } from '../request/types'

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

const uploadFromObject = (
  file: NodeFile | BrowserFile,
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
        check: cancel =>
          info(file, {
            publicKey,
            baseURL,
            cancel,
            source,
            integration,
            retryThrottledRequestMaxTimes
          }).then(response => {
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
          })
      })
    })
  }

  return upload.then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))
}

export default uploadFromObject
