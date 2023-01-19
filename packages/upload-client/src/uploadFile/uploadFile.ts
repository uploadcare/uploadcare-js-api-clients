import defaultSettings from '../defaultSettings'
import { uploadDirect } from './uploadDirect'
import { uploadFromUploaded } from './uploadFromUploaded'
import { uploadFromUrl } from './uploadFromUrl'

/* Types */
import { CustomUserAgent, Metadata } from '@uploadcare/api-client-utils'
import { ProgressCallback, Url, Uuid } from '../api/types'
import { getFileSize } from '../tools/getFileSize'
import { isFileData } from '../tools/isFileData'
import { isMultipart } from '../tools/isMultipart'
import { UploadcareFile } from '../tools/UploadcareFile'
import { StoreValue, SupportedFileInput } from '../types'
import { isUrl, isUuid } from './types'
import { uploadMultipart } from './uploadMultipart'

export type FileFromOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: StoreValue

  signal?: AbortSignal
  onProgress?: ProgressCallback

  source?: string
  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number

  contentType?: string
  multipartMinFileSize?: number
  multipartChunkSize?: number
  maxConcurrentRequests?: number

  baseCDN?: string

  checkForUrlDuplicates?: boolean
  saveUrlForRecurrentUploads?: boolean
  pusherKey?: string

  metadata?: Metadata
}

/**
 * Uploads file from provided data.
 */

export async function uploadFile(
  data: SupportedFileInput | Url | Uuid,
  {
    publicKey,

    fileName,
    baseURL = defaultSettings.baseURL,
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

    contentType,
    multipartMinFileSize,
    multipartChunkSize,
    maxConcurrentRequests,

    baseCDN = defaultSettings.baseCDN,

    checkForUrlDuplicates,
    saveUrlForRecurrentUploads,
    pusherKey,

    metadata
  }: FileFromOptions
): Promise<UploadcareFile> {
  if (isFileData(data)) {
    const fileSize = await getFileSize(data)

    if (isMultipart(fileSize, multipartMinFileSize)) {
      return uploadMultipart(data, {
        publicKey,
        contentType,
        multipartChunkSize,

        fileSize,
        fileName,
        baseURL,
        secureSignature,
        secureExpire,
        store,

        signal,
        onProgress,

        source,
        integration,
        userAgent,

        maxConcurrentRequests,
        retryThrottledRequestMaxTimes,
        retryNetworkErrorMaxTimes,

        baseCDN,
        metadata
      })
    }

    return uploadDirect(data, {
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

      baseCDN,
      metadata
    })
  }

  if (isUrl(data)) {
    return uploadFromUrl(data, {
      publicKey,

      fileName,
      baseURL,
      baseCDN,
      checkForUrlDuplicates,
      saveUrlForRecurrentUploads,
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
      pusherKey,
      metadata
    })
  }

  if (isUuid(data)) {
    return uploadFromUploaded(data, {
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
    })
  }

  throw new TypeError(`File uploading from "${data}" is not supported`)
}
