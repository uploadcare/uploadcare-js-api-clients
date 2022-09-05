import uploadDirect from './uploadDirect'
import uploadFromUrl from './uploadFromUrl'
import uploadFromUploaded from './uploadFromUploaded'
import defaultSettings from '../defaultSettings'

/* Types */
import { Url, Uuid, ProgressCallback, Metadata } from '../api/types'
import { CustomUserAgent } from '@uploadcare/api-client-utils'
import { NodeFile, BrowserFile } from '../request/types'
import { isFileData, isUrl, isUuid } from './types'
import { UploadcareFile } from '../tools/UploadcareFile'
import { isMultipart, getFileSize } from '../tools/isMultipart'
import uploadMultipart from './uploadMultipart'

export type FileFromOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: boolean

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

function uploadFile(
  data: NodeFile | BrowserFile | Url | Uuid,
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
    const fileSize = getFileSize(data)

    if (isMultipart(fileSize, multipartMinFileSize)) {
      return uploadMultipart(data, {
        publicKey,
        contentType,
        multipartChunkSize,

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

export {
  uploadFile,
  uploadFromUrl,
  uploadDirect,
  uploadFromUploaded,
  uploadMultipart
}
