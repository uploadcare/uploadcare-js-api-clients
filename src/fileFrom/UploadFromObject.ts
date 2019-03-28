import {FileData, Settings, UploadcareFile} from '../types'
import {createCancelController} from '../api/request'
import base from '../api/base'
import {ProgressState} from './UploadFrom'
import {UploadFrom} from './UploadFrom'

export class UploadFromObject extends UploadFrom {
  protected request: Promise<UploadcareFile>

  readonly data: FileData
  readonly settings: Settings

  cancel: (() => void)

  constructor(data: FileData, settings: Settings) {
    super()
    const cancelController = createCancelController()

    this.data = data
    this.settings = settings
    this.cancel = cancelController.cancel
    this.request = this.getFilePromise()
  }

  private getFilePromise(): Promise<UploadcareFile> {
    const directUpload = base(this.data, this.settings)
    const filePromise = directUpload

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
