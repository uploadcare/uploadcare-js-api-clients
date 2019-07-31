import {Thenable} from './Thenable'
import {CancelableThenableInterface} from './types'
import {RequestInterface, RequestOptions} from '../api/request/types'
import request from '../api/request/request'

export class CancelableThenable<T> extends Thenable<T> implements CancelableThenableInterface<T> {
  onCancel: VoidFunction | null = null

  protected readonly promise: Promise<T>

  private readonly request: RequestInterface

  constructor(options: RequestOptions) {
    super()

    this.request = request(options)
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
