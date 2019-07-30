import {Thenable} from '../../thenable/Thenable'
import multipartUploadPart from './multipartUploadPart'
import {getFileSize} from './getFileSize'
import {getChunks} from './getChunks'
import defaultSettings from '../../defaultSettings'

/* Types */
import {HandleProgressFunction} from '../request/types'
import {FileData, Settings} from '../../types'
import {ChunkType, MultipartPart} from './types'
import {BaseProgress} from '../types'
import {UploadThenableInterface} from '../../thenable/types'

function throttle(callback, limit = 1) {
  let wait = false                  // Initially, we're not waiting

  return function (...args) {               // We return a throttled function
    if (!wait) {                   // If we're not waiting
      callback(...args)           // Execute users function
      wait = true               // Prevent future invocations
      setTimeout(function () {   // After a period of time
        wait = false          // And allow future invocations
      }, limit);
    }
  }
}

class MultipartUpload extends Thenable<any> implements UploadThenableInterface<any> {
  onProgress: HandleProgressFunction | null = null
  onCancel: VoidFunction | null = null

  protected readonly promise: Promise<any>
  private readonly requests: UploadThenableInterface<any>[]
  private readonly loaded: number[]

  constructor(file: FileData, parts: MultipartPart[], settings: Settings = {}) {
    super()

    const fileSize = getFileSize(file)
    const chunkSize = settings.multipartChunkSize || defaultSettings.multipartChunkSize
    const chunks = getChunks(fileSize, chunkSize)
    const chunksCount = chunks.length

    this.loaded = Array.from(new Array(chunksCount)).fill(0)

    const updateProgress = throttle((progressEvent) => {
      if (typeof this.onProgress === 'function') {
        const loaded = this.loaded.reduce((sum, chunk) => chunk + sum, 0)

        console.log(loaded)
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

      uploadPartPromise.onProgress = (progressEvent: BaseProgress) => {
        if (typeof this.onProgress === 'function') {
          this.loaded[index] = progressEvent.loaded
          updateProgress(progressEvent)
        }
      }

      return uploadPartPromise
    })
    this.promise = Promise.all(this.requests)
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
  }

  cancel(): void {
    this.requests.forEach(request => request.cancel())
  }
}

/**
 * Upload multipart file.
 *
 * @param {FileData} file
 * @param {MultipartPart[]} parts
 * @param {Settings} settings
 * @return {UploadThenableInterface<any>}
 */
export default function multipartUpload(file: FileData, parts: MultipartPart[], settings: Settings = {}): UploadThenableInterface<any> {
  return new MultipartUpload(file, parts, settings)
}

