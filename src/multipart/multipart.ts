import multipartStart from '../api/multipart/multipartStart'
import multipartUpload from '../api/multipart/multipartUpload'
import multipartComplete from '../api/multipart/multipartComplete'
import {Thenable} from '../thenable/Thenable'

/* Types */
import {FileData, SettingsInterface} from '../types'
import {Uuid} from '..'
import {BaseThenableInterface, CancelableThenableInterface} from '../thenable/types'
import {FileInfoInterface} from '../api/types'

class Multipart extends Thenable<FileInfoInterface> implements BaseThenableInterface<FileInfoInterface> {
  onCancel: (() => void) | null = null
  onProgress: ((progressEvent: ProgressEvent) => void) | null = null

  protected readonly promise: Promise<FileInfoInterface>
  private request: BaseThenableInterface<any> | CancelableThenableInterface<any>

  constructor(file: FileData, settings: SettingsInterface) {
    super()

    this.request = multipartStart(file, settings)

    this.promise = this.request
      .then(({uuid, parts}) => {
        this.request = multipartUpload(file, parts, settings)

        // @ts-ignore
        this.request.onProgress = (progressEvent: ProgressEvent) => {
          if (typeof this.onProgress === 'function') {
            this.onProgress({
              ...progressEvent,
              loaded: progressEvent.loaded,
              total: progressEvent.total,
            })
          }
        }

        return this.request
          .then(() => Promise.resolve(uuid))
      })
      .then((uuid: Uuid) => {
        this.request = multipartComplete(uuid, settings)

        return this.request
      })
      .catch(error => {
        if (error.name === 'CancelError' && typeof this.onCancel === 'function') {
          this.onCancel()
        }

        return Promise.reject(error)
      })
  }

  cancel(): void {
    this.request.cancel()
  }
}

/**
 * Upload multipart file.
 *
 * @param {FileData} file
 * @param {SettingsInterface} settings
 * @return {BaseThenableInterface<FileInfoInterface>}
 */
export default function multipart(file: FileData, settings: SettingsInterface = {}): BaseThenableInterface<FileInfoInterface> {
  return new Multipart(file, settings)
}
