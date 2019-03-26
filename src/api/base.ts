import request, {createCancelController, HandleProgressFunction, prepareOptions} from './request'
import {RequestOptions} from './request'
import {Settings, FileData} from '../types'

export type BaseProgress = ProgressEvent

export type BaseResponse = {
  file: string
}

export interface DirectUploadInterface {
  readonly options: RequestOptions
  onProgress: HandleProgressFunction | null
  onCancel: Function | null
  cancel: Function

  upload(): Promise<BaseResponse>
}

export class DirectUpload implements DirectUploadInterface {
  readonly options: RequestOptions
  onProgress: HandleProgressFunction | null = null
  onCancel: Function | null = null
  cancel: Function

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
  }

  upload(): Promise<BaseResponse> {
    return request(this.options)
      .then(response => Promise.resolve(response.data))
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
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
