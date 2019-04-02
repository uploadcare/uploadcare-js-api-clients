import {FileData, Settings, UploadcareFile} from '../types'
import base, {DirectUploadInterface} from '../api/base'
import {ProgressState} from './UploadFrom'
import {UploadFrom} from './UploadFrom'

export class UploadFromObject extends UploadFrom {
  protected request: Promise<UploadcareFile>
  private readonly directUpload: DirectUploadInterface

  readonly data: FileData
  readonly settings: Settings

  cancel: (() => void)

  constructor(data: FileData, settings: Settings) {
    super()
    this.data = data
    this.settings = settings

    this.directUpload = base(this.data, this.settings)

    this.cancel = this.directUpload.cancel
    this.request = this.getFilePromise()
  }

  private getFilePromise(): Promise<UploadcareFile> {
    const filePromise = this.directUpload

    this.setProgress(ProgressState.Uploading)

    filePromise.onProgress = (progressEvent) => {
      this.setProgress(ProgressState.Uploading, progressEvent)

      if (typeof this.onProgress === 'function') {
        this.onProgress(this.getProgress())
      }
    }

    filePromise.onCancel = () => {
      if (typeof this.onCancel === 'function') {
        this.onCancel()
      }
    }

    return filePromise
      .then(({file: uuid}) => {
        return this.handleUploaded(uuid, this.settings)
      })
      .then(this.handleReady)
      .catch(this.handleError)
  }
}
