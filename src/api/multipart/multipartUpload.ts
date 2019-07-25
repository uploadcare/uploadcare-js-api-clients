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

class MultipartUpload extends Thenable<any> implements UploadThenableInterface<any> {
  onProgress: HandleProgressFunction | null = null
  onCancel: VoidFunction | null = null

  protected readonly promise: Promise<any>
  private readonly requests: UploadThenableInterface<any>[]

  constructor(file: FileData, parts: MultipartPart[], settings: Settings = {}) {
    super()

    const fileSize = getFileSize(file)
    const chunkSize = settings.multipartChunkSize || defaultSettings.multipartChunkSize
    const chunks = getChunks(fileSize, chunkSize)
    const chunksCount = chunks.length

    this.requests = chunks.map((chunk: ChunkType, index: number) => {
      const [start, end] = chunk
      const fileChunk = file.slice(start, end)
      const partUrl = parts[index]
      const uploadPartPromise = multipartUploadPart(partUrl, fileChunk)

      uploadPartPromise.onProgress = (progressEvent: BaseProgress) => {
        if (typeof this.onProgress === 'function') {
          const loaded = progressEvent.loaded * 100 / chunksCount
          const total = progressEvent.total * 100 / chunksCount

          this.onProgress({
            ...progressEvent,
            loaded,
            total,
          })
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

