import base from '../api/base'
import { UploadcareFile } from '../tools/UploadcareFile'
import CancelController from '../tools/CancelController'

import { NodeFile, BrowserFile } from '../request/types'
import { isReadyPoll } from '../tools/isReadyPoll'

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
  return base(file, {
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
    retryThrottledRequestMaxTimes
  })
    .then(({ file }) => {
      return isReadyPoll({
        file,
        publicKey,
        baseURL,
        source,
        integration,
        retryThrottledRequestMaxTimes,
        onProgress,
        cancel
      })
    })
    .then((fileInfo) => new UploadcareFile(fileInfo, { baseCDN }))
}

export default uploadFromObject
