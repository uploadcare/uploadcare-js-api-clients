import {Thenable} from '../thenable/Thenable'

/* Types */
import {FileHandlerInterface, FileUploadInterface} from './types'
import {UploadcareFileInterface, UploadingProgress} from '../types'
import {CancelableInterface, FileUploadLifecycleInterface} from '../lifecycle/types'

export class FileUpload extends Thenable<UploadcareFileInterface> implements FileUploadInterface {
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareFileInterface) => void) | null = null
  onCancel: (() => void) | null = null

  protected readonly promise: Promise<UploadcareFileInterface>

  private readonly cancelable: CancelableInterface

  constructor(lifecycle: FileUploadLifecycleInterface, handler: FileHandlerInterface, cancelable: CancelableInterface) {
    super()
    this.cancelable = cancelable
    const uploadLifecycle = lifecycle.getUploadLifecycle()

    uploadLifecycle.onProgress = this.onProgress
    uploadLifecycle.onUploaded = this.onUploaded
    uploadLifecycle.onReady = this.onReady
    uploadLifecycle.onCancel = this.onCancel

    this.promise = handler.upload()
  }

  cancel(): void {
    this.cancelable.cancel()
  }
}
