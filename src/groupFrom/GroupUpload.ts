import {Thenable} from '../thenable/Thenable'

/* Types */
import {UploadcareGroupInterface, UploadingProgress} from '../types'
import {GroupHandlerInterface} from './types'
import {GroupUploadLifecycleInterface} from '../lifecycle/types'
import {GroupUploadInterface} from './types'

export class GroupUpload extends Thenable<UploadcareGroupInterface> implements GroupUploadInterface {
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((file: UploadcareGroupInterface) => void) | null = null
  onCancel: (() => void) | null = null

  protected readonly promise: Promise<UploadcareGroupInterface>

  private readonly lifecycle: GroupUploadLifecycleInterface
  private readonly handler: GroupHandlerInterface

  constructor(lifecycle: GroupUploadLifecycleInterface, handler: GroupHandlerInterface) {
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
