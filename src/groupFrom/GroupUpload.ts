import {Thenable} from '../thenable/Thenable'

/* Types */
import {UploadcareGroupInterface, UploadingProgress} from '../types'
import {CancelableInterface, GroupUploadLifecycleInterface, UploadInterface} from '../lifecycle/types'
import {FileHandlerInterface} from '../fileFrom/types'

export class GroupUpload extends Thenable<UploadcareGroupInterface> implements UploadInterface<UploadcareGroupInterface> {
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareGroupInterface) => void) | null = null
  onCancel: (() => void) | null = null

  protected readonly promise: Promise<UploadcareGroupInterface>
  private readonly cancelable: CancelableInterface

  constructor(lifecycle: GroupUploadLifecycleInterface, handler: FileHandlerInterface<UploadcareGroupInterface>, cancelable: CancelableInterface) {
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
