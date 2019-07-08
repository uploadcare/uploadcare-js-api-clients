import {FileData, Settings, UploadcareFileInterface} from '../types'
import base, {DirectUploadInterface} from '../api/base'
import {UploadFrom} from './UploadFrom'

export class UploadFromObject extends UploadFrom {
  protected readonly request: DirectUploadInterface
  protected readonly promise: Promise<UploadcareFileInterface>

  protected readonly data: FileData
  protected readonly settings: Settings

  constructor(data: FileData, settings: Settings) {
    super()

    this.data = data
    this.settings = settings

    this.request = base(this.data, this.settings)
    this.promise = this.getFilePromise()
  }

  private getFilePromise(): Promise<UploadcareFileInterface> {
    const fileUpload = this.request

    this.handleUploading()

    fileUpload.onProgress = (progressEvent) =>
      this.handleUploading({
        total: progressEvent.total,
        loaded: progressEvent.loaded,
      })

    fileUpload.onCancel = this.handleCancelling

    return fileUpload
      .then(({file: uuid}) => this.handleUploaded(uuid, this.settings))
      .then(this.handleReady)
      .catch(this.handleError)
  }

  cancel(): void {
    return this.request.cancel()
  }
}
