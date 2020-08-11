import defaultSettings from '../defaultSettings'
import multipartStart from '../api/multipartStart'
import multipartUpload from '../api/multipartUpload'
import multipartComplete from '../api/multipartComplete'
import runWithConcurrency from '../tools/runWithConcurrency'
import { UploadcareFile } from '../tools/UploadcareFile'
import { getFileSize } from '../tools/isMultipart'
import { isReadyPoll } from '../tools/isReadyPoll'
import retrier from '../tools/retry'

/* Types */
import {
  MultipartUploadResponse,
  MultipartUploadOptions
} from '../api/multipartUpload'
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
  signal?: AbortSignal
  onProgress?: progressCallback
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
  maxConcurrentRequests?: number
  multipartMaxAttempts?: number
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

const uploadPartWithRetry = (
  chunk: Buffer | Blob,
  url: string,
  {
    publicKey,
    onProgress,
    signal,
    integration,
    multipartMaxAttempts
  }: MultipartUploadOptions & { multipartMaxAttempts: number }
): Promise<MultipartUploadResponse> =>
  retrier(({ attempt, retry }) =>
    multipartUpload(chunk, url, {
      publicKey,
      onProgress,
      signal,
      integration
    }).catch(error => {
      if (attempt < multipartMaxAttempts) {
        return retry()
      }

      throw error
    })
  )

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

    signal,
    onProgress,

    source,
    integration,

    retryThrottledRequestMaxTimes,

    contentType,
    multipartChunkSize = defaultSettings.multipartChunkSize,
    maxConcurrentRequests = defaultSettings.maxConcurrentRequests,
    multipartMaxAttempts = defaultSettings.multipartMaxAttempts,

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
    signal,
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
            uploadPartWithRetry(
              getChunk(file, index, size, multipartChunkSize),
              url,
              {
                publicKey,
                onProgress: createProgressHandler(parts.length, index),
                signal,
                integration,
                multipartMaxAttempts
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
    .then(fileInfo => {
      if (fileInfo.isReady) {
        return fileInfo
      } else {
        return isReadyPoll({
          file: fileInfo.uuid,
          publicKey,
          baseURL,
          source,
          integration,
          retryThrottledRequestMaxTimes,
          onProgress,
          signal
        })
      }
    })
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))
}

export default uploadMultipart
