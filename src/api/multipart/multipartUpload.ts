import {Thenable} from '../../tools/Thenable'
import multipartUploadPart from './multipartUploadPart'
import {getFileSize} from './getFileSize'
import {getChunks} from './getChunks'
import defaultSettings from '../../defaultSettings'

/* Types */
import {HandleProgressFunction} from '../request/types'
import {FileData, Settings} from '../../types'
import {ChunkType, MultipartPart, MultipartUploadInterface} from './types'
import {BaseProgress} from '../types'

class MultipartUpload extends Thenable<any> implements MultipartUploadInterface {
  onProgress: HandleProgressFunction | null = null
  onCancel: VoidFunction | null = null

  protected readonly promise: Promise<any>
  private readonly requests: MultipartUploadInterface[]

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
 * @return {MultipartUploadInterface}
 */
export default function multipartUpload(file: FileData, parts: MultipartPart[], settings: Settings = {}): MultipartUploadInterface {
  return new MultipartUpload(file, parts, settings)
}

