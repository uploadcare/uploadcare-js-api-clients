import {Thenable} from '../thenable/Thenable'

/* Types */
import {UploadcareFileInterface, UploadingProgress} from '../types'
import {FileUploadLifecycleInterface, UploadInterface} from '../lifecycle/types'
import {FileHandlerInterface} from './types'

export class FileUpload extends Thenable<UploadcareFileInterface> implements UploadInterface<UploadcareFileInterface> {
  onProgress: ((progress: UploadingProgress) => void) | null
  onUploaded: ((uuid: string) => void) | null
  onReady: ((file: UploadcareFileInterface) => void) | null
  onCancel: (() => void) | null

  protected readonly promise: Promise<UploadcareFileInterface>

  private readonly lifecycle: FileUploadLifecycleInterface
  private readonly handler: FileHandlerInterface

  constructor(lifecycle: FileUploadLifecycleInterface, handler: FileHandlerInterface) {
    super()

    this.onProgress = null
    this.onUploaded = null
    this.onReady = null
    this.onCancel = null

    this.handler = handler
    this.lifecycle = lifecycle

    const uploadLifecycle = lifecycle.getUploadLifecycle()

    this.promise = handler.upload(lifecycle)
      .then(uploadLifecycle.handleReady)
      .catch(uploadLifecycle.handleError)
  }

  /**
   * Cancel uploading.
   */
  cancel(): void {
    this.handler.cancel(this.lifecycle)
  }
}
