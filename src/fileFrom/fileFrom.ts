import fromObject from './fromObject'
import fromUrl from './fromUrl'
import fromUploaded from './fromUploaded'
import CancelController from '../CancelController'
import defaultSettings from '../defaultSettings'

/* Types */
import { UploadcareFileInterface } from '../types'
import { FileData, Url, Uuid } from '../api/types'
import { isFileData, isUrl, isUuid } from './types'

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
export default function fileFrom(
  data: FileData | Url | Uuid,
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

    contentType,
    multipartChunkSize = defaultSettings.multipartChunkSize,

    baseCDN = defaultSettings.baseCDN
  }: {
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

    contentType: string
    multipartChunkSize?: number

    baseCDN?: string
  }
): Promise<UploadcareFileInterface> {
  if (isFileData(data)) {
    return fromObject(data, {
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
    return fromUrl(data, {
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
    return fromUploaded(data, {
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
