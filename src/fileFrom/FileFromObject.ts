import base from '../api/base'
import defaultSettings from '../defaultSettings'
import multipart from '../multipart/multipart'
import {isMultipart} from '../multipart/isMultipart'

/* Types */
import {FileUploadLifecycleInterface, LifecycleInterface, UploadHandlerInterface} from '../lifecycle/types'
import {BaseThenableInterface} from '../thenable/types'
import {BaseResponse} from '../api/base'
import {FileInfoInterface} from '../api/types'
import {FileData, SettingsInterface, UploadcareFileInterface} from '../types'

export class FileFromObject implements UploadHandlerInterface<UploadcareFileInterface, FileUploadLifecycleInterface> {
  private readonly request: BaseThenableInterface<BaseResponse> | BaseThenableInterface<FileInfoInterface>
  private readonly settings: SettingsInterface
  private readonly isMultipart: boolean = false

  constructor(data: FileData, settings: SettingsInterface, uploadLifecycle: LifecycleInterface<UploadcareFileInterface>) {
    this.settings = settings

    const multipartMinFileSize = settings.multipartMinFileSize || defaultSettings.multipartMinFileSize
    this.isMultipart = isMultipart(data, multipartMinFileSize)

    const onProgress = (progressEvent): void =>
      uploadLifecycle.handleUploading({
        total: progressEvent.total,
        loaded: progressEvent.loaded,
      })
    const onCancel = uploadLifecycle.handleCancelling.bind(uploadLifecycle)

    if (this.isMultipart) {
      this.request = multipart(data, this.settings, {onProgress, onCancel})
    } else {
      this.request = base(data, this.settings, {onProgress, onCancel})
    }
  }

  async upload(fileUploadLifecycle: FileUploadLifecycleInterface): Promise<UploadcareFileInterface> {
    const fileUpload = this.request
    const uploadLifecycle = fileUploadLifecycle.uploadLifecycle

    uploadLifecycle.handleUploading()

    if (this.isMultipart) {
      const upload = fileUpload as BaseThenableInterface<FileInfoInterface>
      const {uuid} = await upload

      return fileUploadLifecycle.handleUploadedFile(uuid, this.settings)
    }

    const upload = fileUpload as BaseThenableInterface<BaseResponse>
    const {file: uuid} = await upload

    return fileUploadLifecycle.handleUploadedFile(uuid, this.settings)
  }

  cancel(): void {
    this.request.cancel()
  }
}
