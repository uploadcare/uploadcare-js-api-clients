import {FileData, Settings, UploadcareFileInterface, UploadingProgress} from '../types'
import base, {DirectUploadInterface} from '../api/base'
import {FileUploadLifecycleInterface, LifecycleInterface} from '../lifecycle/types'
import {Thenable} from '../tools/Thenable'
import {FileUploadInterface} from './types'

export class UploadFromObject extends Thenable<UploadcareFileInterface> implements FileUploadInterface {
  protected readonly promise: Promise<UploadcareFileInterface>

  private readonly fileUploadLifecycle: FileUploadLifecycleInterface
  private readonly uploadLifecycle: LifecycleInterface<UploadcareFileInterface>
  private readonly data: FileData
  private readonly settings: Settings

  private readonly request: DirectUploadInterface

  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareFileInterface) => void) | null = null
  onCancel: VoidFunction | null = null

  constructor(lifecycle: FileUploadLifecycleInterface, data: FileData, settings: Settings) {
    super()
    this.fileUploadLifecycle = lifecycle
    this.uploadLifecycle = this.fileUploadLifecycle.getUploadLifecycle()

    this.data = data
    this.settings = settings

    this.request = base(this.data, this.settings)
    this.promise = this.getFilePromise()

    console.log(this.onProgress, this.onUploaded, this.onReady, this.onCancel)
  }

  private getFilePromise(): Promise<UploadcareFileInterface> {
    this.uploadLifecycle.onProgress = this.onProgress
    this.uploadLifecycle.onUploaded = this.onUploaded
    this.uploadLifecycle.onReady = this.onReady
    this.uploadLifecycle.onCancel = this.onCancel

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

    // console.log(fileUploadLifecycle, uploadLifecycle)

    return fileUpload
      .then(({file: uuid}) => fileUploadLifecycle.handleUploadedFile(uuid, this.settings))
      .then(uploadLifecycle.handleReady)
      .catch(uploadLifecycle.handleError)
  }

  cancel(): void {
    return this.request.cancel()
  }
}
