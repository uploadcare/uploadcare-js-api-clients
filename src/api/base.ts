import request, {HandleProgressFunction, prepareOptions, RequestInterface} from './request'
import {RequestOptions} from './request'
import {Settings, FileData} from '../types'
import {Thenable} from '../tools/Thenable'
import {CancelableInterface} from './types'

export type BaseProgress = ProgressEvent

export type BaseResponse = {
  file: string
}

export interface DirectUploadInterface extends Promise<BaseResponse>, CancelableInterface {
  onProgress: HandleProgressFunction | null
  onCancel: VoidFunction | null
}

class DirectUpload extends Thenable<BaseResponse> implements DirectUploadInterface {
  protected readonly request: RequestInterface
  protected readonly promise: Promise<BaseResponse>
  protected readonly options: RequestOptions

  onProgress: HandleProgressFunction | null = null
  onCancel: VoidFunction | null = null

  constructor(options: RequestOptions) {
    super()

    this.options = options
    this.request = request(this.getRequestOptions())
    this.promise = this.request
      .then(response => Promise.resolve(response.data))
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
  }

  protected getRequestOptions() {
    return {
      ...this.options,
      /* TODO Add support of progress for Node.js */
      onUploadProgress: (progressEvent: BaseProgress) => {
        if (typeof this.onProgress === 'function') {
          this.onProgress(progressEvent)
        }
      },
    }
  }

  cancel(): void {
    return this.request.cancel()
  }
}

const getRequestBody = (file: FileData, settings: Settings) => ({
  UPLOADCARE_PUB_KEY: settings.publicKey || '',
  signature: settings.secureSignature || '',
  expire: settings.secureExpire || '',
  UPLOADCARE_STORE: settings.doNotStore ? '' : 'auto',
  source: 'local',
  file: file,
})

const getRequestOptions = (file: FileData, settings: Settings): RequestOptions => {
  return prepareOptions({
    method: 'POST',
    path: '/base/',
    body: getRequestBody(file, settings),
  }, settings)
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
  const options = getRequestOptions(file, settings)

  return new DirectUpload(options)
}
