import { Thenable } from './Thenable'
import request from '../api/request/request'

/* Types */
import { BaseThenableInterface } from './types'
import { RequestInterface, RequestOptionsInterface } from '../api/request/types'
import { BaseHooksInterface } from '../lifecycle/types'

export class BaseThenable<T> extends Thenable<T>
  implements BaseThenableInterface<T> {
  protected readonly promise: Promise<T>
  private readonly request: RequestInterface

  constructor(options: RequestOptionsInterface, hooks?: BaseHooksInterface) {
    super()

    this.request = request({
      ...options,
      onUploadProgress: (progressEvent: ProgressEvent) => {
        if (hooks && typeof hooks.onProgress === 'function') {
          hooks.onProgress(progressEvent)
        }
      }
    })
    this.promise = this.request
      .then(response => Promise.resolve(response.data))
      .catch(error => {
        if (
          hooks &&
          error.name === 'CancelError' &&
          typeof hooks.onCancel === 'function'
        ) {
          hooks.onCancel()
        }

        return Promise.reject(error)
      })
  }

  cancel(): void {
    return this.request.cancel()
  }
}
