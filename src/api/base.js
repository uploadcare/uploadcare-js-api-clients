/* @flow */
import request, {createCancelController, prepareOptions} from './request'
import type {RequestOptions} from './request'
import type {Settings, FileData} from '../types'

export type BaseResponse = {|
  file: string
|}

export class DirectUpload {
  _promise: Promise<BaseResponse>
  onProgress: ?Function
  onCancel: ?Function
  cancel: Function

  constructor(options: RequestOptions) {
    const cancelController = createCancelController()

    this._promise = request({
      ...options,
      /* TODO Add support of progress for Node.js */
      onUploadProgress: (progressEvent) => {
        if (typeof this.onProgress === 'function') {
          this.onProgress(progressEvent)
        }
      },
      cancelToken: cancelController.token,
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

  then(onFulfilled?: Function, onRejected?: Function) {
    return this._promise.then(onFulfilled, onRejected)
  }

  catch(onRejected?: Function) {
    return this._promise.catch(onRejected)
  }

  finally(onFinally: Function) {
    return this._promise.finally(onFinally)
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
