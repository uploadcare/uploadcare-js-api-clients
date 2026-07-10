import defaultSettings from '../defaultSettings'
import { uploadDirect } from './uploadDirect'
import { uploadFromUploaded } from './uploadFromUploaded'
import { uploadFromUrl } from './uploadFromUrl'

/* Types */
import {
  CustomUserAgent,
  Metadata,
  StoreValue,
  Tags
} from '@uploadcare/api-client-utils'
import { ProgressCallback, Url, Uuid } from '../api/types'
import { getFileSize } from '../tools/getFileSize'
import { isFileData } from '../tools/isFileData'
import { isMultipart } from '../tools/isMultipart'
import { UploadcareFile } from '../tools/UploadcareFile'
import { SupportedFileInput } from '../types'
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
  prefixedBaseCDN?: string

  checkForUrlDuplicates?: boolean
  saveUrlForRecurrentUploads?: boolean
  pusherKey?: string

  metadata?: Metadata
  tags?: Tags
}

/** Uploads file from provided data. */

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

    // Left undefined on purpose when the caller omits it, so `resolveCdnBase`
    // can distinguish "not set" (→ prefixed default) from an explicit base
    // (→ used verbatim, e.g. the legacy `https://ucarecdn.com`).
    baseCDN,
    prefixedBaseCDN = defaultSettings.prefixedBaseCDN,

    checkForUrlDuplicates,
    saveUrlForRecurrentUploads,
    pusherKey,

    metadata,
    tags
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
        prefixedBaseCDN,
        metadata,
        tags
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
      prefixedBaseCDN,
      metadata,
      tags
    })
  }

  if (isUrl(data)) {
    return uploadFromUrl(data, {
      publicKey,

      fileName,
      baseURL,
      baseCDN,
      prefixedBaseCDN,
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
      metadata,
      tags
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

      baseCDN,
      prefixedBaseCDN
    })
  }

  throw new TypeError(`File uploading from "${data}" is not supported`)
}
