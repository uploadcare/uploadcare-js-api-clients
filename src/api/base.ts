import request, {createCancelController, HandleProgressFunction, prepareOptions} from './request'
import {RequestOptions} from './request'
import {Settings, FileData} from '../types'
import {Thenable} from '../tools/Thenable'

export type BaseProgress = ProgressEvent

export type BaseResponse = {
  file: string
}

export interface DirectUploadInterface extends Promise<BaseResponse> {
  readonly options: RequestOptions
  readonly cancel: VoidFunction

  onProgress: HandleProgressFunction | null
  onCancel: VoidFunction | null
}

class DirectUpload extends Thenable<BaseResponse> implements DirectUploadInterface {
  protected request: Promise<BaseResponse>

  readonly options: RequestOptions
  readonly cancel: VoidFunction

  onProgress: HandleProgressFunction | null = null
  onCancel: VoidFunction | null = null

  constructor(options: RequestOptions) {
    super()
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
