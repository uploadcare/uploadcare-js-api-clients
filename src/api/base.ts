import request, {createCancelController, HandleProgressFunction, prepareOptions} from './request'
import {RequestOptions} from './request'
import {Settings, FileData} from '../types'

export type BaseProgress = ProgressEvent

export type BaseResponse = {
  file: string
}

export interface DirectUploadInterface extends Promise<BaseResponse> {
  readonly [Symbol.toStringTag]: string
  readonly options: RequestOptions
  readonly cancel: (() => void)

  onProgress: HandleProgressFunction | null
  onCancel: (() => void) | null

  then<TFulfilled = BaseResponse, TRejected = never>(
    onFulfilled?: ((value: BaseResponse) => (PromiseLike<TFulfilled> | TFulfilled)) | undefined | null,
    onRejected?: ((reason: any) => (PromiseLike<TRejected> | TRejected)) | undefined | null
  ): Promise<TFulfilled | TRejected>
  catch<TRejected = never>(
    onRejected?: ((reason: any) => (PromiseLike<TRejected> | TRejected)) | undefined | null
  ): Promise<BaseResponse | TRejected>
}

export class DirectUpload implements DirectUploadInterface {
  protected request: Promise<BaseResponse>

  readonly [Symbol.toStringTag]: string
  readonly options: RequestOptions
  readonly cancel: (() => void)

  onProgress: HandleProgressFunction | null = null
  onCancel: (() => void) | null = null

  constructor(options: RequestOptions) {
    const cancelController = createCancelController()

    this.options = {
      ...options,
      /* TODO Add support of progress for Node.js */
      onUploadProgress: (progressEvent: BaseProgress) => {
        if (typeof this.onProgress === 'function') {
          this.onProgress(progressEvent)
        }
      },
      cancelToken: cancelController.token,
    }
    this.cancel = cancelController.cancel
    this.request = request(this.options)
      .then(response => Promise.resolve(response.data))
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
  }

  then<TFulfilled = BaseResponse, TRejected = never>(
    onFulfilled?: ((value: BaseResponse) => (PromiseLike<TFulfilled> | TFulfilled)) | undefined | null,
    onRejected?: ((reason: any) => (PromiseLike<TRejected> | TRejected)) | undefined | null
  ): Promise<TFulfilled | TRejected> {
    return this.request.then(onFulfilled, onRejected)
  }
  catch<TRejected = never>(
    onRejected?: ((reason: any) => (PromiseLike<TRejected> | TRejected)) | undefined | null
  ): Promise<BaseResponse | TRejected> {
    return this.request.catch(onRejected)
  }
}

/**
 * Performs file uploading request to Uploadcare Upload API.
 * Can be canceled and has progress.
 *
 * @param {FileData} file
 * @param {Settings} settings
 * @return {DirectUploadInterface}
 */
export default function base(file: FileData, settings: Settings = {}): DirectUploadInterface {
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
