import base from '../api/base'
import {getFileSize} from '../api/multipart/getFileSize'
import defaultSettings from '../defaultSettings'
import multipart from '../multipart/multipart'

/* Types */
import {FileUploadLifecycleInterface} from '../lifecycle/types'
import {FileHandlerInterface} from './types'
import {BaseThenableInterface} from '../thenable/types'
import {BaseResponse} from '../api/base'
import {FileInfoInterface} from '../api/types'
import {FileData, SettingsInterface, UploadcareFileInterface} from '../types'

/**
 * Check if FileData is multipart data.
 *
 * @param {FileData} data
 * @param {number} multipartMinFileSize
 * @return {boolean}
 */
const isMultipart = (data: FileData, multipartMinFileSize: number): boolean => {
  const fileSize = getFileSize(data)

  return fileSize >= multipartMinFileSize
}

export class FileFromObject implements FileHandlerInterface {
  private readonly request: BaseThenableInterface<BaseResponse> | BaseThenableInterface<FileInfoInterface>
  private readonly settings: SettingsInterface
  private readonly isMultipart: boolean = false

  constructor(data: FileData, settings: SettingsInterface) {
    this.settings = settings

    const multipartMinFileSize = settings.multipartMinFileSize || defaultSettings.multipartMinFileSize
    this.isMultipart = isMultipart(data, multipartMinFileSize)

    if (this.isMultipart) {
      this.request = multipart(data, this.settings)
    } else {
      this.request = base(data, this.settings)
    }
  }

  async upload(fileUploadLifecycle: FileUploadLifecycleInterface): Promise<UploadcareFileInterface> {
    const fileUpload = this.request
    const uploadLifecycle = fileUploadLifecycle.uploadLifecycle

    uploadLifecycle.handleUploading()

    fileUpload.onProgress = (progressEvent): void =>
      uploadLifecycle.handleUploading({
        total: progressEvent.total,
        loaded: progressEvent.loaded,
      })

    fileUpload.onCancel = uploadLifecycle.handleCancelling.bind(uploadLifecycle)

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
