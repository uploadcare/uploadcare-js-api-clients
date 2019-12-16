import base, { FileData } from '../api/base'
import info from '../api/info'
import { poll } from '../tools/poller'
import { UploadcareFile } from '../UploadcareFile'
import CancelController from '../CancelController'

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
    baseCDN,
    defaultEffects
  }: {
    publicKey: string

    fileName?: string
    baseURL?: string
    secureSignature?: string
    secureExpire?: string
    store?: boolean

    cancel?: CancelController
    onProgress?: (value: number) => void

    source?: string
    integration?: string

    retryThrottledRequestMaxTimes?: number

    baseCDN?: string
    defaultEffects?: string
  }
): Promise<UploadcareFile> => {
  let progress

  return base(file, {
    publicKey,
    fileName,
    baseURL,
    secureSignature,
    secureExpire,
    store,
    cancel,
    onProgress: (value: number) => {
      progress = value * 0.98
      onProgress && onProgress(progress)
    },
    source,
    integration,
    retryThrottledRequestMaxTimes
  }).then(({ file }) => {
    return poll({
      check: async () => {
        const response = await info(file, {
          publicKey,
          baseURL,
          cancel,
          source,
          integration,
          retryThrottledRequestMaxTimes
        })

        if (response.isReady) {
          return response
        }

        if (onProgress) {
          const { done, total } = response

          onProgress(progress + done / total)
        }
        return false
      }
    }).then(fileInfo =>
      Promise.resolve(
        UploadcareFile.fromFileInfo(fileInfo, { baseCDN, defaultEffects })
      )
    )
  })
}

export default fromObject
