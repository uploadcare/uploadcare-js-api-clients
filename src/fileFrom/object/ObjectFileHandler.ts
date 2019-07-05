import {Settings, UploadcareFileInterface} from '../../types'
import {FileUploadLifecycleInterface, LifecycleInterface} from '../../lifecycle/types'
import {DirectUploadInterface} from '../..'
import {FileHandlerInterface} from '../types'

export class ObjectFileHandler implements FileHandlerInterface {
  private readonly fileUploadLifecycle: FileUploadLifecycleInterface
  private readonly uploadLifecycle: LifecycleInterface<UploadcareFileInterface>

  private readonly settings: Settings

  private readonly request: DirectUploadInterface

  constructor(request: DirectUploadInterface, lifecycle: FileUploadLifecycleInterface, settings: Settings) {
    this.request = request
    this.fileUploadLifecycle = lifecycle
    this.uploadLifecycle = this.fileUploadLifecycle.getUploadLifecycle()
    this.settings = settings
  }

  upload(): Promise<UploadcareFileInterface> {
    const fileUpload = this.request
    const uploadLifecycle = this.uploadLifecycle
    const fileUploadLifecycle = this.fileUploadLifecycle

    uploadLifecycle.handleUploading()

    fileUpload.onProgress = (progressEvent) =>
      uploadLifecycle.handleUploading({
        total: progressEvent.total,
        loaded: progressEvent.loaded,
      })

    fileUpload.onCancel = uploadLifecycle.handleCancelling

    return fileUpload
      .then(({file: uuid}) => fileUploadLifecycle.handleUploadedFile(uuid, this.settings))
      .then(this.uploadLifecycle.handleReady)
      .catch(this.uploadLifecycle.handleError)
  }
}
