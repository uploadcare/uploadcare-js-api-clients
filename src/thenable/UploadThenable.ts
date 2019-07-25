import {Thenable} from './Thenable'
import {UploadThenableInterface} from './types'
import {HandleProgressFunction, RequestInterface, RequestOptions} from '../api/request/types'
import request from '../api/request/request'
import {BaseProgress} from '../api/types'

export class UploadThenable<T> extends Thenable<T> implements UploadThenableInterface<T> {
  onProgress: HandleProgressFunction | null = null
  onCancel: VoidFunction | null = null

  protected readonly promise: Promise<T>

  private readonly request: RequestInterface

  constructor(options: RequestOptions) {
    super()

    this.request = request({
      ...options,
      onUploadProgress: (progressEvent: BaseProgress) => {
        if (typeof this.onProgress === 'function') {
          this.onProgress(progressEvent)
        }
      },
    })
    this.promise = this.request
      .then(response => Promise.resolve(response.data))
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
  }

  cancel(): void {
    return this.request.cancel()
  }
}
