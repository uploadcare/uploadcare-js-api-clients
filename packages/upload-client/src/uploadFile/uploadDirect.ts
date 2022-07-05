import base from '../api/base'
import { UploadcareFile } from '../tools/UploadcareFile'
import { isReadyPoll } from '../tools/isReadyPoll'

import { NodeFile, BrowserFile } from '../request/types'
import { Metadata, ProgressCallback } from '../api/types'
import { CustomUserAgent } from '@uploadcare/api-client-utils'

type DirectOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: boolean
  contentType?: string

  signal?: AbortSignal
  onProgress?: ProgressCallback

  source?: string
  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number

  baseCDN?: string
  metadata?: Metadata
}

const uploadDirect = (
  file: NodeFile | BrowserFile,
  {
    publicKey,

    fileName,
    baseURL,
    secureSignature,
    secureExpire,
    store,
    contentType,

    signal,
    onProgress,

    source,
    integration,
    userAgent,

    retryThrottledRequestMaxTimes,

    baseCDN,
    metadata
  }: DirectOptions
): Promise<UploadcareFile> => {
  return base(file, {
    publicKey,
    fileName,
    contentType,
    baseURL,
    secureSignature,
    secureExpire,
    store,
    signal,
    onProgress,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes,
    metadata
  })
    .then(({ file }) => {
      return isReadyPoll({
        file,
        publicKey,
        baseURL,
        source,
        integration,
        userAgent,
        retryThrottledRequestMaxTimes,
        onProgress,
        signal
      })
    })
    .then((fileInfo) => new UploadcareFile(fileInfo, { baseCDN }))
}

export default uploadDirect
