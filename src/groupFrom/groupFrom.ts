import fileFrom, { FileFromOptions } from '../fileFrom/fileFrom'
import defaultSettings from '../defaultSettings'
import group from '../api/group'

/* Types */
import { isFileDataArray, isUrlArray, isUuidArray } from './types'
import { FileData, Url, Uuid } from '../api/types'
import { UploadcareGroup } from '../UploadcareGroup'

export type GroupFromOptions = {
  jsonpCallback?: string
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
 * @param [options.contentType]
 * @param [options.multipartChunkSize]
 * @param [options.baseCDN]
 */
export default function groupFrom(
  data: FileData[] | Url[] | Uuid[],
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

    contentType = 'application/octet-stream',
    multipartChunkSize = defaultSettings.multipartChunkSize,

    baseCDN = defaultSettings.baseCDN,

    jsonpCallback
  }: FileFromOptions & GroupFromOptions
): Promise<UploadcareGroup> {
  if (!isFileDataArray(data) || !isUrlArray(data) || !isUuidArray(data)) {
    throw new TypeError(`Group uploading from "${data}" is not supported`)
  }

  return Promise.all(
    data.map(file =>
      fileFrom(file, {
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
    )
  ).then(files => {
    const uuids = files.map(file => file.uuid)

    return group(uuids, {
      publicKey,
      baseURL,
      jsonpCallback,
      secureSignature,
      secureExpire,
      cancel,
      source,
      integration,
      retryThrottledRequestMaxTimes
    }).then(groupInfo => new UploadcareGroup(groupInfo, files))
  })
}
