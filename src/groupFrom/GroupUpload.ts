import {Thenable} from '../tools/Thenable'
import {UploadcareGroupInterface, UploadingProgress} from '../types'
import {GroupHandlerInterface} from './types'
import {CancelableInterface} from '../api/types'
import {GroupUploadLifecycleInterface} from '../lifecycle/types'
import {GroupUploadInterface} from './types'

export class GroupUpload extends Thenable<UploadcareGroupInterface> implements GroupUploadInterface {
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareGroupInterface) => void) | null = null
  onCancel: VoidFunction | null = null

  protected readonly promise: Promise<UploadcareGroupInterface>
  private readonly cancelable: CancelableInterface

  constructor(lifecycle: GroupUploadLifecycleInterface, handler: GroupHandlerInterface, cancelable: CancelableInterface) {
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
