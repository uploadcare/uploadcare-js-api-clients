import {Thenable} from '../../thenable/Thenable'
import multipartUploadPart from './multipartUploadPart'
import {getFileSize} from './getFileSize'
import {getChunks} from './getChunks'
import defaultSettings from '../../defaultSettings'

/* Types */
import {FileData, SettingsInterface} from '../../types'
import {ChunkType, MultipartPart, MultipartUploadResponse} from './types'
import {BaseThenableInterface} from '../../thenable/types'

/**
 * Throttle function.
 *
 * @param {Function} callback
 * @param {number} limit
 */
function throttle(callback: Function, limit = 1): Function {
  let wait = false                  // Initially, we're not waiting

  return function (...args): void {               // We return a throttled function
    if (!wait) {                   // If we're not waiting
      callback(...args)           // Execute users function
      wait = true               // Prevent future invocations
      setTimeout(function () {   // After a period of time
        wait = false          // And allow future invocations
      }, limit)
    }
  }
}

class MultipartUpload extends Thenable<void> implements BaseThenableInterface<void> {
  onProgress: ((progressEvent: ProgressEvent) => void) | null = null
  onCancel: (() => void) | null = null

  protected readonly promise: Promise<void>
  private readonly requests: BaseThenableInterface<MultipartUploadResponse>[]
  private readonly loaded: number[]

  constructor(file: FileData, parts: MultipartPart[], settings: SettingsInterface = {}) {
    super()

    const fileSize = getFileSize(file)
    const chunkSize = settings.multipartChunkSize || defaultSettings.multipartChunkSize
    const chunks = getChunks(fileSize, chunkSize)
    const chunksCount = chunks.length

    this.loaded = Array.from(new Array(chunksCount)).fill(0)

    const updateProgress = throttle((progressEvent: ProgressEvent) => {
      if (typeof this.onProgress === 'function') {
        const loaded = this.loaded.reduce((sum, chunk) => chunk + sum, 0)

        this.onProgress({
          ...progressEvent,
          loaded,
          total: fileSize,
        })
      }
    })

    this.requests = chunks.map((chunk: ChunkType, index: number) => {
      const [start, end] = chunk
      const fileChunk = file.slice(start, end)
      const partUrl = parts[index]
      const uploadPartPromise = multipartUploadPart(partUrl, fileChunk)

      uploadPartPromise.onProgress = (progressEvent: ProgressEvent): void => {
        if (typeof this.onProgress === 'function') {
          this.loaded[index] = progressEvent.loaded
          updateProgress(progressEvent)
        }
      }

      return uploadPartPromise
    })
    this.promise = Promise.all(this.requests)
      .then(() => Promise.resolve())
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
  }

  /**
   * Cancel uploading.
   */
  cancel(): void {
    this.requests.forEach(request => request.cancel())
  }
}

/**
 * Upload multipart file.
 *
 * @param {FileData} file - File to upload.
 * @param {MultipartPart[]} parts - Multipart parts (array of urls).
 * @param {SettingsInterface} settings - Client settings.
 * @return {BaseThenableInterface<void>}
 */
export default function multipartUpload(file: FileData, parts: MultipartPart[], settings: SettingsInterface = {}): BaseThenableInterface<void> {
  return new MultipartUpload(file, parts, settings)
}

