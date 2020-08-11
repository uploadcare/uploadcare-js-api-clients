import base from '../api/base'
import { UploadcareFile } from '../tools/UploadcareFile'

import { NodeFile, BrowserFile } from '../request/types'
import { isReadyPoll } from '../tools/isReadyPoll'

type FromObjectOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: boolean

  signal?: AbortSignal
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

    signal,
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
    signal,
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
        signal
      })
    })
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))
}

export default uploadFromObject
