import base, {BaseResponse} from '../api/base'
import {getFileSize} from '../api/multipart/getFileSize'
import multipart from '../multipart/multipart'

/* Types */
import {UploadFrom} from './UploadFrom'
import {FileData, SettingsInterface, UploadcareFileInterface} from '../types'
import defaultSettings from '../defaultSettings'
import {BaseThenableInterface} from '../thenable/types'
import {FileInfoInterface} from '../api/types'

export class UploadFromObject extends UploadFrom {
  protected readonly promise: Promise<UploadcareFileInterface>

  private readonly request: BaseThenableInterface<BaseResponse> | BaseThenableInterface<FileInfoInterface>
  private readonly data: FileData
  private readonly settings: SettingsInterface
  private readonly isMultipart: boolean = false

  constructor(data: FileData, settings: SettingsInterface) {
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
      return (fileUpload as BaseThenableInterface<FileInfoInterface>)
        .then(({uuid}) => this.handleUploaded(uuid, this.settings))
        .then(this.handleReady)
        .catch(this.handleError)
    }

    return (fileUpload as BaseThenableInterface<BaseResponse>)
      .then(({file: uuid}) => this.handleUploaded(uuid, this.settings))
      .then(this.handleReady)
      .catch(this.handleError)
  }

  cancel(): void {
    return this.request.cancel()
  }
}
