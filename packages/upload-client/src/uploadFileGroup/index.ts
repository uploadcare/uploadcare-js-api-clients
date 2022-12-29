import { uploadFile, FileFromOptions } from '../uploadFile'
import defaultSettings from '../defaultSettings'
import group from '../api/group'
import { UploadcareGroup } from '../tools/UploadcareGroup'
import { UploadcareFile } from '../tools/UploadcareFile'

/* Types */
import { isFileDataArray, isUrlArray, isUuidArray } from './types'
import {
  ComputableProgressInfo,
  ProgressCallback,
  UnknownProgressInfo,
  Url,
  Uuid
} from '../api/types'
import { NodeFile, BrowserFile } from '../types'

export type GroupFromOptions = {
  jsonpCallback?: string
}

export default function uploadFileGroup(
  data: (NodeFile | BrowserFile)[] | Url[] | Uuid[],
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
    multipartChunkSize = defaultSettings.multipartChunkSize,

    baseCDN = defaultSettings.baseCDN,

    jsonpCallback
  }: FileFromOptions & GroupFromOptions
): Promise<UploadcareGroup> {
  if (!isFileDataArray(data) && !isUrlArray(data) && !isUuidArray(data)) {
    throw new TypeError(`Group uploading from "${data}" is not supported`)
  }

  let progressValues: number[]
  let isStillComputable = true
  const filesCount = data.length
  const createProgressHandler = (
    size: number,
    index: number
  ): ProgressCallback | undefined => {
    if (!onProgress) return
    if (!progressValues) {
      progressValues = Array(size).fill(0)
    }

    const normalize = (values: number[]): number =>
      values.reduce((sum, next) => sum + next) / size

    return (info: ComputableProgressInfo | UnknownProgressInfo): void => {
      if (!info.isComputable || !isStillComputable) {
        isStillComputable = false
        onProgress({ isComputable: false })
        return
      }
      progressValues[index] = info.value
      onProgress({ isComputable: true, value: normalize(progressValues) })
    }
  }

  return Promise.all<UploadcareFile>(
    (data as (NodeFile | BrowserFile)[]).map(
      (file: NodeFile | BrowserFile | Url | Uuid, index: number) =>
        uploadFile(file, {
          publicKey,

          fileName,
          baseURL,
          secureSignature,
          secureExpire,
          store,

          signal,
          onProgress: createProgressHandler(filesCount, index),

          source,
          integration,
          userAgent,

          retryThrottledRequestMaxTimes,
          retryNetworkErrorMaxTimes,

          contentType,
          multipartChunkSize,

          baseCDN
        })
    )
  ).then((files) => {
    const uuids = files.map((file) => file.uuid)

    return group(uuids, {
      publicKey,
      baseURL,
      jsonpCallback,
      secureSignature,
      secureExpire,
      signal,
      source,
      integration,
      userAgent,
      retryThrottledRequestMaxTimes,
      retryNetworkErrorMaxTimes
    })
      .then((groupInfo) => new UploadcareGroup(groupInfo, files))
      .then((group) => {
        onProgress && onProgress({ isComputable: true, value: 1 })
        return group
      })
  })
}
