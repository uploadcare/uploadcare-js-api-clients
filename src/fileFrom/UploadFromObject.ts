import {FileData, Settings, UploadcareFile} from '../types'
import base, {DirectUploadInterface} from '../api/base'
import {UploadFrom} from './UploadFrom'

export class UploadFromObject extends UploadFrom {
  protected readonly request: DirectUploadInterface
  protected readonly promise: Promise<UploadcareFile>

  protected readonly data: FileData
  protected readonly settings: Settings

  constructor(data: FileData, settings: Settings) {
    super()

    this.data = data
    this.settings = settings

    this.request = base(this.data, this.settings)
    this.promise = this.getFilePromise()
  }

  private getFilePromise(): Promise<UploadcareFile> {
    const filePromise = this.request

    this.handleUploading()

    filePromise.onProgress = (progressEvent) => {
      this.handleUploading({
        total: progressEvent.total,
        loaded: progressEvent.loaded,
      })
    }

    filePromise.onCancel = this.handleCancelling

    return filePromise
      .then(({file: uuid}) => {
        return this.handleUploaded(uuid, this.settings)
      })
      .then(this.handleReady)
      .catch(this.handleError)
  }

  cancel(): void {
    return this.request.cancel()
  }
}
