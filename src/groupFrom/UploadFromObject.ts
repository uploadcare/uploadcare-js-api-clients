import {FileData, Settings, UploadcareFileInterface, UploadcareGroupInterface} from '../types'
import {UploadFrom} from './UploadFrom'
import group, {GroupInfoResponse} from '../api/group'
import CancelError from '../errors/CancelError'
import fileFrom from '../fileFrom/fileFrom'
import {FileFrom, FileUploadInterface} from '../fileFrom/types'

export class UploadFromObject extends UploadFrom {
  protected readonly promise: Promise<UploadcareGroupInterface>

  private readonly data: FileData[]
  private readonly settings: Settings
  private readonly uploads: FileUploadInterface[]
  private readonly files: Promise<UploadcareFileInterface[]>

  constructor(data: FileData[], settings: Settings) {
    super()

    this.data = data
    this.settings = settings

    this.uploads = this.getUploadsPromises()
    this.files = this.getFilesPromise()
    this.promise = this.getGroupPromise()
  }

  private getUploadsPromises = (): FileUploadInterface[] => {
    const filesTotalCount = this.data.length

    return this.data.map((file: FileData, index: number) => {
      const fileUpload = fileFrom(FileFrom.Object, file, this.settings)
      const fileNumber = index + 1

      fileUpload.onCancel = this.handleCancelling

      fileUpload.onUploaded = (() => {
        this.handleUploading({
          total: filesTotalCount,
          loaded: fileNumber
        })
      })

      return fileUpload
    })
  }

  private getFilesPromise = (): Promise<UploadcareFileInterface[]> => {
    return Promise.all(this.uploads)
  }

  private getGroupPromise = (): Promise<UploadcareGroupInterface> => {
    this.handleUploading()

    return this.getFilesPromise()
      .then(files => {
        const uuids = files.map(file => file.uuid)

        return group(uuids, this.settings)
      })
      .then(this.handleInfoResponse)
      .then(this.handleReady)
      .catch(this.handleError)
  }

  private handleInfoResponse = (groupInfo: GroupInfoResponse) => {
    if (this.isCancelled) {
      return Promise.reject(new CancelError())
    }

    return this.handleUploaded(groupInfo, this.settings)
  }

  cancel(): void {
    this.isCancelled = true
  }
}
