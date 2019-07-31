import multipartStart from '../api/multipart/multipartStart'
import multipartUpload from '../api/multipart/multipartUpload'
import multipartComplete from '../api/multipart/multipartComplete'
import {Thenable} from '../thenable/Thenable'

/* Types */
import {FileData, Settings} from '../types'
import {MultipartCompleteResponse} from '../api/multipart/types'
import {HandleProgressFunction} from '../api/request/types'
import {Uuid} from '..'
import {BaseThenableInterface, CancelableThenableInterface} from '../thenable/types'
import {BaseProgress} from '../api/types'

class Multipart extends Thenable<MultipartCompleteResponse> implements BaseThenableInterface<MultipartCompleteResponse> {
  onCancel: VoidFunction | null = null
  onProgress: HandleProgressFunction | null = null

  protected readonly promise: Promise<MultipartCompleteResponse>
  private request: BaseThenableInterface<any> | CancelableThenableInterface<any>

  constructor(file: FileData, settings: Settings) {
    super()

    this.request = multipartStart(file, settings)

    this.promise = this.request
      .then(({uuid, parts}) => {
        this.request = multipartUpload(file, parts, settings)

        // @ts-ignore
        this.request.onProgress = (progressEvent: BaseProgress) => {
          if (typeof this.onProgress === 'function') {
            this.onProgress({
              ...progressEvent,
              loaded: progressEvent.loaded,
              total: progressEvent.total,
            })
          }
        }

        return this.request
          .then(() => Promise.resolve(uuid))
      })
      .then((uuid: Uuid) => {
        this.request = multipartComplete(uuid, settings)

        return this.request
      })
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
  }

  cancel(): void {
    this.request.cancel()
  }
}

/**
 * Upload multipart file.
 *
 * @param {FileData} file
 * @param {Settings} settings
 * @return {BaseThenableInterface<MultipartCompleteResponse>}
 */
export default function multipart(file: FileData, settings: Settings = {}): BaseThenableInterface<MultipartCompleteResponse> {
  return new Multipart(file, settings)
}
