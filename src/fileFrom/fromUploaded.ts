import { Uuid } from '..'
import CancelController from '../CancelController'
import { UploadcareFile } from '../UploadcareFile'
import info from '../api/info'

const fromUploaded = (
  uuid: Uuid,
  {
    publicKey,
    fileName,
    baseURL,
    cancel,
    onProgress,
    source,
    integration,
    retryThrottledRequestMaxTimes,
    baseCDN
  }: {
    publicKey: string

    fileName?: string
    baseURL?: string

    cancel?: CancelController
    onProgress?: ({ value: number }) => void

    source?: string
    integration?: string

    retryThrottledRequestMaxTimes?: number

    baseCDN?: string
  }
): Promise<UploadcareFile> => {
  return info(uuid, {
    publicKey,
    baseURL,
    cancel,
    source,
    integration,
    retryThrottledRequestMaxTimes
  })
    .then(fileInfo =>
      Promise.resolve(new UploadcareFile(fileInfo, { baseCDN, fileName }))
    )
    .then(result => {
      // hack for node ¯\_(ツ)_/¯
      if (onProgress) onProgress({ value: 1 })

      return result
    })
}

export default fromUploaded
