import {Thenable} from '../thenable/Thenable'

/* Types */
import {UploadcareFileInterface, UploadingProgress} from '../types'
import {FileUploadLifecycleInterface, UploadInterface} from '../lifecycle/types'
import {FileHandlerInterface} from './types'

export class FileUpload extends Thenable<UploadcareFileInterface> implements UploadInterface<UploadcareFileInterface> {
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareFileInterface) => void) | null = null
  onCancel: (() => void) | null = null

  protected readonly promise: Promise<UploadcareFileInterface>

  private readonly lifecycle: FileUploadLifecycleInterface
  private readonly handler: FileHandlerInterface

  constructor(lifecycle: FileUploadLifecycleInterface, handler: FileHandlerInterface) {
    super()

    this.handler = handler
    this.lifecycle = lifecycle
    this.promise = handler.upload(lifecycle)
  }

  /**
   * Cancel uploading.
   */
  cancel(): void {
    this.handler.cancel(this.lifecycle)
  }
}
