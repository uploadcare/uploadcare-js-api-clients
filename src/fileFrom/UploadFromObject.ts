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

    this.cancel = () => {
      if (this.timerId) {
        clearTimeout(this.timerId)
      }

      this.directUpload.cancel()
    }
    this.request = this.getFilePromise()
  }

  private getFilePromise(): Promise<UploadcareFile> {
    const filePromise = this.directUpload

    this.handleUploading()

    filePromise.onProgress = (progressEvent) => {
      this.handleUploading({
        total: progressEvent.total,
        loaded: progressEvent.loaded,
      })
    }

    filePromise.onCancel = () => {
      this.handleCancelling()
    }

    return filePromise
      .then(({file: uuid}) => {
        return this.handleUploaded(uuid, this.settings)
      })
      .then(this.handleReady)
      .catch(this.handleError)
  }
}
