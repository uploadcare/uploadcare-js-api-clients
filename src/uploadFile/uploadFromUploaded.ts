import { UploadcareFile } from '../tools/UploadcareFile'
import info from '../api/info'

/* Types */
import { Uuid } from '..'
import { ProgressCallback } from '../api/types'

type FromUploadedOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string

  signal?: AbortSignal
  onProgress?: ProgressCallback

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
    signal,
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
    signal,
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
