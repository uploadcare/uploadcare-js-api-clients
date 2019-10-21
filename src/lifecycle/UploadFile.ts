import {Thenable} from '../thenable/Thenable'

/* Types */
import {UploadcareFileInterface, UploadingProgress} from '../types'
import {FileUploadLifecycleInterface, UploadInterface} from '../lifecycle/types'
import {UploadHandlerInterface} from '../fileFrom/types'

export class UploadFile extends Thenable<UploadcareFileInterface> implements UploadInterface<UploadcareFileInterface> {
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareFileInterface) => void) | null = null
  onCancel: (() => void) | null = null

  protected readonly promise: Promise<UploadcareFileInterface>

  private readonly lifecycle: FileUploadLifecycleInterface
  private readonly handler: UploadHandlerInterface<UploadcareFileInterface, FileUploadLifecycleInterface>

  constructor(
    lifecycle: FileUploadLifecycleInterface,
    handler: UploadHandlerInterface<UploadcareFileInterface, FileUploadLifecycleInterface>
  ) {
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
