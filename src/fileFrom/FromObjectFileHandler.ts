import {FileHandlerInterface} from './types'
import {BaseThenableInterface} from '../thenable/types'
import base, {BaseResponse} from '../api/base'
import {FileInfoInterface} from '../api/types'
import {FileData, SettingsInterface, UploadcareFileInterface} from '../types'
import {getFileSize} from '../api/multipart/getFileSize'
import defaultSettings from '../defaultSettings'
import multipart from '../multipart/multipart'
import {FileUploadLifecycleInterface} from '../lifecycle/types'

export class FromObjectFileHandler implements FileHandlerInterface {
  private readonly request: BaseThenableInterface<BaseResponse> | BaseThenableInterface<FileInfoInterface>
  private readonly settings: SettingsInterface
  private readonly isMultipart: boolean = false

  constructor(data: FileData, settings: SettingsInterface) {
    this.settings = settings

    const fileSize = getFileSize(data)
    const multipartMinFileSize = settings.multipartMinFileSize || defaultSettings.multipartMinFileSize

    if (fileSize < multipartMinFileSize) {
      this.request = base(data, this.settings)
    } else {
      this.isMultipart = true
      this.request = multipart(data, this.settings)
    }
  }

  async upload(lifecycle: FileUploadLifecycleInterface): Promise<UploadcareFileInterface> {
    const fileUpload = this.request
    const uploadLifecycle = lifecycle.getUploadLifecycle()

    uploadLifecycle.handleUploading()

    fileUpload.onProgress = (progressEvent): void =>
      uploadLifecycle.handleUploading({
        total: progressEvent.total,
        loaded: progressEvent.loaded,
      })

    fileUpload.onCancel = uploadLifecycle.handleCancelling

    if (this.isMultipart) {
      const upload = fileUpload as BaseThenableInterface<FileInfoInterface>
      const {uuid} = await upload

      return lifecycle.handleUploadedFile(uuid, this.settings)
    }

    const upload = fileUpload as BaseThenableInterface<BaseResponse>
    const {file: uuid} = await upload

    return lifecycle.handleUploadedFile(uuid, this.settings)
  }

  cancel(): void {
    this.request.cancel()
  }
}
