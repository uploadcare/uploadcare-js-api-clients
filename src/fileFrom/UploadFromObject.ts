import {FileData, Settings, UploadcareFile, UploadingProgress} from '../types'
import base, {DirectUploadInterface} from '../api/base'
import {FileUploadLifecycleInterface} from '../lifecycle/types'
import {Thenable} from '../tools/Thenable'
import {FileUploadInterface} from './types'

export class UploadFromObject extends Thenable<UploadcareFile> implements FileUploadInterface {
  protected readonly promise: Promise<UploadcareFile>

  private readonly lifecycle: FileUploadLifecycleInterface
  private readonly data: FileData
  private readonly settings: Settings

  private readonly request: DirectUploadInterface

  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareFile) => void) | null = null
  onCancel: VoidFunction | null = null

  constructor(lifecycle: FileUploadLifecycleInterface, data: FileData, settings: Settings) {
    super()
    this.lifecycle = lifecycle

    this.lifecycle.getUploadLifecycle().onProgress = this.onProgress
    this.lifecycle.getUploadLifecycle().onUploaded = this.onUploaded
    this.lifecycle.getUploadLifecycle().onReady = this.onReady
    this.lifecycle.getUploadLifecycle().onCancel = this.onCancel

    this.data = data
    this.settings = settings

    this.request = base(this.data, this.settings)
    this.promise = this.getFilePromise()
  }

  private async getFilePromise(): Promise<UploadcareFile> {
    const fileUpload = this.request
    const lifecycle = this.lifecycle.getUploadLifecycle()

    lifecycle.handleUploading()

    fileUpload.onProgress = (progressEvent) =>
      lifecycle.handleUploading({
        total: progressEvent.total,
        loaded: progressEvent.loaded,
      })

    fileUpload.onCancel = lifecycle.handleCancelling

    const {file: uuid} = await fileUpload

    await this.lifecycle.handleUploadedFile(uuid, this.settings)

    return lifecycle.handleReady()

    // return new Promise((resolve, reject) => {
    //   lifecycle.handleReady, lifecycle.handleError
    // })

    // try {
    //   const {file: uuid} = await fileUpload
    //
    //   await lifecycle.handleUploadedFile(uuid, this.settings)
    //
    //   return lifecycle.handleReady()
    // } catch (error) {
    //   lifecycle.handleError(error)
    // }
  }

  cancel(): void {
    return this.request.cancel()
  }
}
