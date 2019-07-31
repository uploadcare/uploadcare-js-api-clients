import base from '../api/base'
import {getFileSize} from '../api/multipart/getFileSize'
import multipart from '../multipart/multipart'

/* Types */
import {UploadFrom} from './UploadFrom'
import {FileData, Settings, UploadcareFileInterface} from '../types'
import {MultipartCompleteResponse} from '../api/multipart/types'
import {DirectUploadInterface} from '../api/types'
import defaultSettings from '../defaultSettings'
import {BaseThenableInterface} from '../thenable/types'

export class UploadFromObject extends UploadFrom {
  protected readonly promise: Promise<UploadcareFileInterface>

  private readonly request: DirectUploadInterface | BaseThenableInterface<MultipartCompleteResponse>
  private readonly data: FileData
  private readonly settings: Settings
  private readonly isMultipart: boolean = false

  constructor(data: FileData, settings: Settings) {
    super()

    this.data = data
    this.settings = settings

    const fileSize = getFileSize(data)
    const multipartMinFileSize = settings.multipartMinFileSize || defaultSettings.multipartMinFileSize

    if (fileSize < multipartMinFileSize) {
      this.request = base(this.data, this.settings)
    } else {
      this.isMultipart = true
      this.request = multipart(this.data, this.settings)
    }

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

    if (this.isMultipart) {
      return (fileUpload as BaseThenableInterface<MultipartCompleteResponse>)
        .then(({uuid}) => this.handleUploaded(uuid, this.settings))
        .then(this.handleReady)
        .catch(this.handleError)
    }

    return (fileUpload as DirectUploadInterface)
      .then(({file: uuid}) => this.handleUploaded(uuid, this.settings))
      .then(this.handleReady)
      .catch(this.handleError)
  }

  cancel(): void {
    return this.request.cancel()
  }
}
