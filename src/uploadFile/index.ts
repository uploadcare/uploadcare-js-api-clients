import uploadFromObject from './uploadFromObject'
import uploadFromUrl from './uploadFromUrl'
import uploadFromUploaded from './uploadFromUploaded'
import CancelController from '../tools/CancelController'
import defaultSettings from '../defaultSettings'

/* Types */
import { Url, Uuid } from '../api/types'
import { NodeFile, BrowserFile } from '../request/types'
import { isFileData, isUrl, isUuid } from './types'
import { UploadcareFile } from '../tools/UploadcareFile'

export type FileFromOptions = {
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

  contentType?: string
  multipartChunkSize?: number

  baseCDN?: string
}

/**
 * Uploads file from provided data.
 * @param data
 * @param options
 * @param [options.publicKey]
 * @param [options.fileName]
 * @param [options.baseURL]
 * @param [options.secureSignature]
 * @param [options.secureExpire]
 * @param [options.store]
 * @param [options.cancel]
 * @param [options.onProgress]
 * @param [options.source]
 * @param [options.integration]
 * @param [options.retryThrottledRequestMaxTimes]
 */
export default function uploadFile(
  data: NodeFile | BrowserFile | Url | Uuid,
  {
    publicKey,

    fileName = defaultSettings.fileName,
    baseURL = defaultSettings.baseURL,
    secureSignature,
    secureExpire,
    store,

    cancel,
    onProgress,

    source,
    integration,

    retryThrottledRequestMaxTimes,

    contentType = defaultSettings.contentType,
    multipartChunkSize = defaultSettings.multipartChunkSize,

    baseCDN = defaultSettings.baseCDN
  }: FileFromOptions
): Promise<UploadcareFile> {
  if (isFileData(data)) {
    return uploadFromObject(data, {
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

      contentType,
      multipartChunkSize,

      baseCDN
    })
  }

  if (isUrl(data)) {
    return uploadFromUrl(data, {
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
    })
  }

  if (isUuid(data)) {
    return uploadFromUploaded(data, {
      publicKey,

      fileName,
      baseURL,

      cancel,
      onProgress,

      source,
      integration,

      retryThrottledRequestMaxTimes,

      baseCDN
    })
  }

  throw new TypeError(`File uploading from "${data}" is not supported`)
}
