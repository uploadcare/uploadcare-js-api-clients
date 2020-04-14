import defaultSettings from '../defaultSettings'
import multipartStart from '../api/multipartStart'
import multipartUpload from '../api/multipartUpload'
import multipartComplete from '../api/multipartComplete'
import CancelController from '../tools/CancelController'
import runWithConcurrency from '../tools/runWithConcurrency'
import { UploadcareFile } from '../tools/UploadcareFile'
import { getFileSize } from '../tools/isMultipart'

/* Types */
import { MultipartUploadResponse } from '../api/multipartUpload'
import { NodeFile, BrowserFile } from '../request/types'

type progressCallback = ({ value: number }) => void

export type MultipartOptions = {
  publicKey: string
  contentType?: string
  multipartChunkSize?: number
  fileName?: string
  fileSize?: number
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: boolean
  cancel?: CancelController
  onProgress?: progressCallback
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
  maxConcurrentRequests?: number
  baseCDN?: string
}

const getChunk = (
  file: Buffer | Blob,
  index: number,
  fileSize: number,
  chunkSize: number
): Buffer | Blob => {
  const start = chunkSize * index
  const end = Math.min(start + chunkSize, fileSize)

  return file.slice(start, end)
}

const uploadMultipart = (
  file: NodeFile | BrowserFile,
  {
    publicKey,

    fileName,
    fileSize,
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
    multipartChunkSize = defaultSettings.multipartChunkSize,
    maxConcurrentRequests = defaultSettings.maxConcurrentRequests,

    baseCDN
  }: MultipartOptions
): Promise<UploadcareFile> => {
  const size = fileSize || getFileSize(file)

  let progressValues: number[]
  const createProgressHandler = (
    size: number,
    index: number
  ): progressCallback | undefined => {
    if (!onProgress) return
    if (!progressValues) {
      progressValues = Array(size).fill(0)
    }

    const sum = (values: number[]): number =>
      values.reduce((sum, next) => sum + next, 0)

    return ({ value }: { value: number }): void => {
      progressValues[index] = value
      onProgress({ value: sum(progressValues) / size })
    }
  }

  return multipartStart(size, {
    publicKey,
    contentType,
    fileName: fileName ?? (file as File).name,
    baseURL,
    secureSignature,
    secureExpire,
    store,
    cancel,
    source,
    integration,
    retryThrottledRequestMaxTimes
  })
    .then(({ uuid, parts }) =>
      Promise.all([
        uuid,
        runWithConcurrency(
          maxConcurrentRequests,
          parts.map((url, index) => (): Promise<MultipartUploadResponse> =>
            multipartUpload(
              getChunk(file, index, size, multipartChunkSize),
              url,
              {
                publicKey,
                onProgress: createProgressHandler(parts.length, index),
                cancel,
                integration
              }
            )
          )
        )
      ])
    )
    .then(([uuid]) =>
      multipartComplete(uuid, {
        publicKey,
        baseURL,
        source,
        integration,
        retryThrottledRequestMaxTimes
      })
    )
    .then(result => {
      // hack for node ¯\_(ツ)_/¯
      if (onProgress) onProgress({ value: 1 })

      return result
    })
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))
}

export default uploadMultipart
