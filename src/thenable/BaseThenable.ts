import {Thenable} from './Thenable'
import {BaseThenableInterface} from './types'
import {RequestInterface, RequestOptionsInterface} from '../api/request/types'
import request from '../api/request/request'

export class BaseThenable<T> extends Thenable<T> implements BaseThenableInterface<T> {
  onProgress: ((progressEvent: ProgressEvent) => void) | null = null
  onCancel: (() => void) | null = null

  protected readonly promise: Promise<T>

  private readonly request: RequestInterface

  constructor(options: RequestOptionsInterface) {
    super()

    this.request = request({
      ...options,
      onUploadProgress: (progressEvent: ProgressEvent) => {
        if (typeof this.onProgress === 'function') {
          this.onProgress(progressEvent)
        }
      },
    })
    this.promise = this.request
      .then(response => {
        return Promise.resolve(response.data)
      })
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
