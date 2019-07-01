import {UploadGroupFrom} from './UploadGroupFrom'
import {FileData, Settings, UploadcareFile, UploadcareGroup} from '../types'
import {UploadcareFiles} from '../types'
import fileFrom from '../fileFrom/fileFrom'

export class UploadGroupFromObject extends UploadGroupFrom {
  protected readonly promise: Promise<UploadcareGroup>

  protected readonly data: Array<FileData>
  protected readonly settings: Settings

  constructor(data: Array<FileData>, settings: Settings) {
    super()

    this.data = data
    this.settings = settings

    this.promise = this.getFilePromise()
  }

  private getFilePromise(): Promise<UploadcareFiles> {
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
  }
}
