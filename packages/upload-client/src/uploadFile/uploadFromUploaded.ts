import { UploadcareFile } from '../tools/UploadcareFile'
import { isReadyPoll } from '../tools/isReadyPoll'

/* Types */
import { Uuid } from '..'
import { ProgressCallback } from '../api/types'
import { CustomUserAgent } from '@uploadcare/api-client-utils'

export type FromUploadedOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string

  signal?: AbortSignal
  onProgress?: ProgressCallback

  source?: string
  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number

  baseCDN?: string
}

export const uploadFromUploaded = (
  uuid: Uuid,
  {
    publicKey,
    fileName,
    baseURL,
    signal,
    onProgress,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes,
    baseCDN
  }: FromUploadedOptions
): Promise<UploadcareFile> => {
  return isReadyPoll(uuid, {
    publicKey,
    baseURL,
    signal,
    onProgress,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes
  }).then((fileInfo) => new UploadcareFile(fileInfo, { baseCDN, fileName }))
}
