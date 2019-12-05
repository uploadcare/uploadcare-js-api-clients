import multipartStart from '../api/multipart/multipartStart'
import multipartUpload from '../api/multipart/multipartUpload'
import multipartComplete from '../api/multipart/multipartComplete'
import {Thenable} from '../thenable/Thenable'

/* Types */
import {FileData, SettingsInterface} from '../types'
import {Uuid} from '..'
import {BaseThenableInterface, CancelableThenableInterface} from '../thenable/types'
import {FileInfoInterface} from '../api/types'
import {BaseHooksInterface} from '../lifecycle/types'

class Multipart extends Thenable<FileInfoInterface> implements BaseThenableInterface<FileInfoInterface> {
  onCancel: (() => void) | null = null
  onProgress: ((progressEvent: ProgressEvent) => void) | null = null

  protected readonly promise: Promise<FileInfoInterface>
  private request: BaseThenableInterface<any> | CancelableThenableInterface<any>

  constructor(file: FileData, settings: SettingsInterface, hooks?: BaseHooksInterface) {
    super()

    this.request = multipartStart(file, settings)

    this.promise = this.request
      .then(({uuid, parts}) => {
        const onProgress = (progressEvent: ProgressEvent): void => {
          if (hooks && typeof hooks.onProgress === 'function') {
            hooks.onProgress({
              ...progressEvent,
              loaded: progressEvent.loaded,
              total: progressEvent.total,
            })
          }
        }
        this.request = multipartUpload(file, parts, settings, {onProgress})

        return this.request
          .then(() => Promise.resolve(uuid))
      })
      .then((uuid: Uuid) => {
        this.request = multipartComplete(uuid, settings)

        return this.request
      })
      .catch(error => {
        if (error.name === 'CancelError' && hooks && typeof hooks.onCancel === 'function') {
          hooks.onCancel()
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
 * @param {BaseHooksInterface} hooks
 * @return {BaseThenableInterface<FileInfoInterface>}
 */
export default function multipart(file: FileData, settings: SettingsInterface = {}, hooks?: BaseHooksInterface): BaseThenableInterface<FileInfoInterface> {
  return new Multipart(file, settings, hooks)
}
