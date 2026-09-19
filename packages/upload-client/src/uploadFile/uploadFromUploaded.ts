import { UploadcareFile } from '../tools/UploadcareFile'
import { toUploadcareFile } from '../tools/toUploadcareFile'
import { isReadyPoll } from '../tools/isReadyPoll'

/* Types */
import { Uuid } from '..'
import { ProgressCallback } from '../api/types'
import { CustomUserAgent } from '@uploadcare/api-client-utils'
import { AuthToken } from '../types'

export type FromUploadedOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string
  authToken?: AuthToken

  signal?: AbortSignal
  onProgress?: ProgressCallback

  source?: string
  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number

  baseCDN?: string
  prefixedBaseCDN?: string
}

export const uploadFromUploaded = (
  uuid: Uuid,
  {
    publicKey,
    fileName,
    baseURL,
    authToken,
    signal,
    onProgress,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes,
    baseCDN,
    prefixedBaseCDN
  }: FromUploadedOptions
): Promise<UploadcareFile> => {
  return isReadyPoll(uuid, {
    publicKey,
    baseURL,
    authToken,
    signal,
    onProgress,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes
  }).then((fileInfo) =>
    toUploadcareFile(fileInfo, {
      publicKey,
      baseCDN,
      prefixedBaseCDN,
      fileName
    })
  )
}
