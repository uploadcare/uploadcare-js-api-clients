import request, {createCancelController, HandleProgressFunction, prepareOptions} from './request'
import {RequestOptions} from './request'
import {Settings, FileData} from '../types'

export type BaseProgress = ProgressEvent

export type BaseResponse = {
  file: string
}

export class DirectUpload implements Promise<BaseResponse> {
  private request: Promise<BaseResponse>
  onProgress: HandleProgressFunction | null
  onCancel: Function | null
  cancel: Function

  constructor(options: RequestOptions) {
    const cancelController = createCancelController()

    this.request = request({
      ...options,
      /* TODO Add support of progress for Node.js */
      onUploadProgress: (progressEvent: BaseProgress) => {
        if (typeof this.onProgress === 'function') {
          this.onProgress(progressEvent)
        }
      }
    })
      .then(response => response.data)
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
    this.onProgress = null
    this.onCancel = null
    this.cancel = cancelController.cancel
  }

  readonly [Symbol.toStringTag]: string

  catch<TResult = never>(
    onRejected?: ((reason: any) => (PromiseLike<TResult> | TResult)) | undefined | null
  ): Promise<BaseResponse | TResult> {
    return this.request.catch(onRejected)
  }

  finally(onFinally?: (() => void) | undefined | null): Promise<BaseResponse> {
    return this.request.finally(onFinally)
  }

  then<TResult1 = BaseResponse, TResult2 = never>(
    onFulfilled?: ((value: BaseResponse) => (PromiseLike<TResult1> | TResult1)) | undefined | null,
    onRejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.request.then(onFulfilled, onRejected)
  }
}

/**
 * Performs file uploading request to Uploadcare Upload API.
 * Can be canceled and has progress.
 *
 * @param {FileData} file
 * @param {Settings} settings
 * @return {DirectUpload}
 */
export default function base(file: FileData, settings: Settings = {}): DirectUpload {
  const options: RequestOptions = prepareOptions({
    method: 'POST',
    path: '/base/',
    body: {
      UPLOADCARE_PUB_KEY: settings.publicKey || '',
      signature: settings.secureSignature || '',
      expire: settings.secureExpire || '',
      UPLOADCARE_STORE: settings.doNotStore ? '' : 'auto',
      file: file,
      source: 'local',
    },
  }, settings)

  return new DirectUpload(options)
}
