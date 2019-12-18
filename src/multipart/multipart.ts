import multipartStart from '../api/multipartStart'
import multipartUpload from '../api/multipartUpload'
import multipartComplete from '../api/multipartComplete'
import CancelController from '../tools/CancelController'
import defaultSettings from '../defaultSettings'

/* Types */
import { FileInfo } from '../api/types'

type progressCallback = ({ value: number }) => void

export type MultipartOptions = {
  publicKey: string
  contentType: string
  multipartChunkSize?: number
  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: boolean
  cancel?: CancelController
  onProgress?: progressCallback
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
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

/**
 * Upload multipart file.
 */
export default function multipart(
  file: File | Buffer | Blob,
  {
    publicKey,
    contentType,
    multipartChunkSize = defaultSettings.multipartChunkSize,
    fileName,
    baseURL,
    secureSignature,
    secureExpire,
    store,
    cancel,
    onProgress,
    source,
    integration,
    retryThrottledRequestMaxTimes
  }: MultipartOptions
): Promise<FileInfo> {
  const fileSize: number = (file as Buffer).length || (file as Blob).size

  let progressValues: number[]
  const createProgressHandler = (
    size: number,
    index: number
  ): progressCallback | undefined => {
    if (!onProgress) return
    if (!progressValues) {
      progressValues = Array(size).fill(0)
    }

    const normalize = (values: number[]): number =>
      values.reduce((sum, next) => sum + next) / size

    return ({ value }: { value: number }): void => {
      progressValues[index] = value
      onProgress({ value: normalize(progressValues) })
    }
  }

  return multipartStart(fileSize, {
    publicKey,
    contentType,
    fileName,
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
        Promise.all(
          parts.map((url, index) =>
            multipartUpload(
              getChunk(file, index, fileSize, multipartChunkSize),
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
}
