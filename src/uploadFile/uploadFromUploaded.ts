import CancelController from '../tools/CancelController'
import { UploadcareFile } from '../tools/UploadcareFile'
import info from '../api/info'

/* Types */
import { Uuid } from '..'

type FromUploadedOptions = {
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

const uploadFromUploaded = (
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
  }: FromUploadedOptions
): Promise<UploadcareFile> => {
  return info(uuid, {
    publicKey,
    baseURL,
    cancel,
    source,
    integration,
    retryThrottledRequestMaxTimes
  })
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN, fileName }))
    .then(result => {
      // hack for node ¯\_(ツ)_/¯
      if (onProgress) onProgress({ value: 1 })

      return result
    })
}

export default uploadFromUploaded
