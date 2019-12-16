import fromObject from './fromObject'

/* Types */
import { FileData, UploadcareFileInterface } from '../types'
import { Url, Uuid } from '../api/types'
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
    baseCDN,
    defaultEffects
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

      baseCDN,
      defaultEffects
    })
  }

  if (isUrl(data)) {
    // const fileHandler = new FileFromUrl(data, settings)
    //
    // return new Upload<UploadcareFileInterface, FileUploadLifecycleInterface>(
    //   fileUploadLifecycle,
    //   fileHandler
    // )
  }

  if (isUuid(data)) {
    // const fileHandler = new FileFromUploaded(data, settings)
    //
    // return new Upload<UploadcareFileInterface, FileUploadLifecycleInterface>(
    //   fileUploadLifecycle,
    //   fileHandler
    // )
  }

  throw new TypeError(`File uploading from "${data}" is not supported`)
}
