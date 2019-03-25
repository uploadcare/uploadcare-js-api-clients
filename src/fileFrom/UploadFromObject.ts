import {FileData, Settings, UploadcareFile} from '../types'
import {createCancelController} from '../api/request'
import base from '../api/base'
import {ProgressState} from './UploadFrom'
import {UploadFrom, UploadCancellableInterface} from './UploadFrom'

export class UploadFromObject extends UploadFrom implements UploadCancellableInterface {
  readonly data: FileData
  readonly settings: Settings
  cancel: Function

  constructor(data: FileData, settings: Settings) {
    super()
    const cancelController = createCancelController()

    this.data = data
    this.settings = settings
    this.cancel = cancelController.cancel
  }

  upload(): Promise<UploadcareFile> {
    const directUpload = base(this.data, this.settings)
    const filePromise = directUpload.upload()

    this.setProgress(ProgressState.Uploading)

    directUpload.onProgress = (progressEvent) => {
      this.setProgress(ProgressState.Uploading, progressEvent)

      if (typeof this.onProgress === 'function') {
        this.onProgress(this.getProgress())
      }
    }

    directUpload.onCancel = () => {
      if (typeof this.onCancel === 'function') {
        this.onCancel()
      }
    }

    return filePromise
      .then(({file: uuid}) => {
        return this.handleUploaded(uuid, this.settings)
      })
      .catch(this.handleError)
      .then(this.handleReady)
  }
}
