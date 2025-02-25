import {
  CustomUserAgent,
  Metadata,
  StoreValue
} from '@uploadcare/api-client-utils'
import multipartComplete from '../api/multipartComplete'
import multipartStart from '../api/multipartStart'
import multipartUpload, {
  MultipartUploadOptions,
  MultipartUploadResponse
} from '../api/multipartUpload'
import defaultSettings from '../defaultSettings'
import { isReadyPoll } from '../tools/isReadyPoll'
import runWithConcurrency from '../tools/runWithConcurrency'
import { UploadcareFile } from '../tools/UploadcareFile'
import { prepareChunks } from './prepareChunks.node'

import {
  ComputableProgressInfo,
  ProgressCallback,
  UnknownProgressInfo
} from '../api/types'
import { getContentType } from '../tools/getContentType'
import { getFileName } from '../tools/getFileName'
import { getFileSize } from '../tools/getFileSize'
import { SupportedFileInput } from '../types'

export type MultipartOptions = {
  publicKey: string
  contentType?: string
  multipartChunkSize?: number
  fileName?: string
  fileSize?: number
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: StoreValue
  signal?: AbortSignal
  onProgress?: ProgressCallback<ComputableProgressInfo>
  source?: string
  integration?: string
  userAgent?: CustomUserAgent
  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
  maxConcurrentRequests?: number
  baseCDN?: string
  metadata?: Metadata
}

const uploadPart = (
  chunk: Buffer | Blob,
  url: string,
  {
    publicKey,
    contentType,
    onProgress,
    signal,
    integration,
    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes
  }: MultipartUploadOptions
): Promise<MultipartUploadResponse> =>
  multipartUpload(chunk, url, {
    publicKey,
    contentType,
    onProgress,
    signal,
    integration,
    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes
  })

export const uploadMultipart = async (
  file: SupportedFileInput,
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
    userAgent,

    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes,

    contentType,
    multipartChunkSize = defaultSettings.multipartChunkSize,
    maxConcurrentRequests = defaultSettings.maxConcurrentRequests,

    baseCDN,
    metadata
  }: MultipartOptions
): Promise<UploadcareFile> => {
  const size = fileSize ?? (await getFileSize(file))

  let progressValues: number[]
  const createProgressHandler = (
    totalChunks: number,
    chunkIdx: number
  ): ProgressCallback | undefined => {
    if (!onProgress) return
    if (!progressValues) {
      progressValues = Array(totalChunks).fill(0)
    }

    const sum = (values: number[]): number =>
      values.reduce((sum, next) => sum + next, 0)

    return (info: ComputableProgressInfo | UnknownProgressInfo): void => {
      if (!info.isComputable) {
        return
      }
      progressValues[chunkIdx] = info.value
      onProgress({
        isComputable: true,
        value: sum(progressValues) / totalChunks
      })
    }
  }

  contentType ||= getContentType(file)

  return multipartStart(size, {
    publicKey,
    contentType,
    fileName: fileName || getFileName(file),
    baseURL,
    secureSignature,
    secureExpire,
    store,
    signal,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes,
    metadata,
    multipartChunkSize
  })
    .then(async ({ uuid, parts }) => {
      const getChunk = await prepareChunks(file, size, multipartChunkSize)
      return Promise.all([
        uuid,
        runWithConcurrency(
          maxConcurrentRequests,
          parts.map(
            (url, index) => (): Promise<MultipartUploadResponse> =>
              uploadPart(getChunk(index), url, {
                publicKey,
                contentType,
                onProgress: createProgressHandler(parts.length, index),
                signal,
                integration,
                retryThrottledRequestMaxTimes,
                retryNetworkErrorMaxTimes
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
        userAgent,
        retryThrottledRequestMaxTimes,
        retryNetworkErrorMaxTimes
      })
    )
    .then((fileInfo) => {
      if (fileInfo.isReady) {
        return fileInfo
      } else {
        return isReadyPoll(fileInfo.uuid, {
          publicKey,
          baseURL,
          source,
          integration,
          userAgent,
          retryThrottledRequestMaxTimes,
          retryNetworkErrorMaxTimes,
          onProgress,
          signal
        })
      }
    })
    .then((fileInfo) => new UploadcareFile(fileInfo, { baseCDN }))
}
