import base from '../api/base'
import info from '../api/info'
import { poll } from '../tools/poll'
import { UploadcareFile } from '../tools/UploadcareFile'
import CancelController from '../tools/CancelController'

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

    baseCDN
  }: FromObjectOptions
): Promise<UploadcareFile> => {
  let progress: number

  const onProgressCallback = ({ value }): void => {
    progress = value * 0.98
    onProgress && onProgress({ value: progress })
  }

  return base(file, {
    publicKey,
    fileName,
    baseURL,
    secureSignature,
    secureExpire,
    store,
    cancel,
    onProgress: onProgress ? onProgressCallback : undefined,
    source,
    integration,
    retryThrottledRequestMaxTimes
  })
    .then(({ file }) => {
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
              onProgress({
                value: Math.min(progress + 0.02, 1)
              })
            }

            return false
          })
      })
    })
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))
}

export default uploadFromObject
