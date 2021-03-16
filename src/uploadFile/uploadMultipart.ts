import defaultSettings from '../defaultSettings'
import { prepareChunks } from './prepareChunks.node'
import multipartStart from '../api/multipartStart'
import multipartUpload from '../api/multipartUpload'
import multipartComplete from '../api/multipartComplete'
import CancelController from '../tools/CancelController'
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
  cancel?: CancelController
  onProgress?: progressCallback
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
  maxConcurrentRequests?: number
  multipartMaxAttempts?: number
  baseCDN?: string
}

const uploadPartWithRetry = (
  chunk: Buffer | Blob,
  url: string,
  {
    publicKey,
    onProgress,
    cancel,
    integration,
    multipartMaxAttempts
  }: MultipartUploadOptions & { multipartMaxAttempts: number }
): Promise<MultipartUploadResponse> =>
  retrier(({ attempt, retry }) =>
    multipartUpload(chunk, url, {
      publicKey,
      onProgress,
      cancel,
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

    cancel,
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
    cancel,
    source,
    integration,
    retryThrottledRequestMaxTimes
  })
    .then(({ uuid, parts }) => {
      const getChunk = prepareChunks(file, size, multipartChunkSize)
      return Promise.all([
        uuid,
        runWithConcurrency(
          maxConcurrentRequests,
          parts.map((url, index) => (): Promise<MultipartUploadResponse> =>
            uploadPartWithRetry(getChunk(index), url, {
              publicKey,
              onProgress: createProgressHandler(parts.length, index),
              cancel,
              integration,
              multipartMaxAttempts
            })
          )
        )
      ])
    })
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
          cancel
        })
      }
    })
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))
}

export default uploadMultipart
