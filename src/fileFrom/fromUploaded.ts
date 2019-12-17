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
    onProgress,
    source,
    integration,
    retryThrottledRequestMaxTimes
  }).then(fileInfo =>
    Promise.resolve(
      UploadcareFile.fromFileInfo(fileInfo, { baseCDN, fileName })
    )
  )
}

export default fromUploaded
