import base from '../api/base'
import { isReadyPoll } from '../tools/isReadyPoll'
import { UploadcareFile } from '../tools/UploadcareFile'

import {
  CustomUserAgent,
  Metadata,
  StoreValue
} from '@uploadcare/api-client-utils'
import { ProgressCallback } from '../api/types'
import { SupportedFileInput } from '../types'

export type DirectOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: StoreValue
  contentType?: string

  signal?: AbortSignal
  onProgress?: ProgressCallback

  source?: string
  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number

  baseCDN?: string
  metadata?: Metadata
}

export const uploadDirect = (
  file: SupportedFileInput,
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
    retryNetworkErrorMaxTimes,

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
    retryNetworkErrorMaxTimes,
    metadata
  })
    .then(({ file }) => {
      return isReadyPoll(file, {
        publicKey,
        baseURL,
        source,
        integration,
        userAgent,
        retryThrottledRequestMaxTimes,
        retryNetworkErrorMaxTimes,
        onProgress,
        signal
      })
    })
    .then((fileInfo) => new UploadcareFile(fileInfo, { baseCDN }))
}
