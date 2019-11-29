import {Thenable} from './Thenable'
import request from '../api/request/request'

/* Types */
import {CancelableThenableInterface} from './types'
import {RequestInterface, RequestOptionsInterface} from '../api/request/types'
import {CancelHookInterface} from '../lifecycle/types'

export class CancelableThenable<T> extends Thenable<T> implements CancelableThenableInterface<T> {
  onCancel: (() => void) | null = null

  protected readonly promise: Promise<T>

  private readonly request: RequestInterface

  constructor(options: RequestOptionsInterface, hooks?: CancelHookInterface) {
    super()

    this.request = request(options)
    this.promise = this.request
      .then(response => Promise.resolve(response.data))
      .catch(error => {
        if (error.name === 'CancelError' && hooks && typeof hooks.onCancel === 'function') {
          hooks.onCancel()
        }

        return Promise.reject(error)
      })
  }

  cancel(): void {
    return this.request.cancel()
  }
}
