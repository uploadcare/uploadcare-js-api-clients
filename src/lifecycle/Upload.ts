import {Thenable} from '../thenable/Thenable'

/* Types */
import {UploadHandlerInterface, UploadInterface} from '../lifecycle/types'

export class Upload<T, U> extends Thenable<T> implements UploadInterface<T> {
  protected readonly promise: Promise<T>

  private readonly lifecycle: U
  private readonly handler: UploadHandlerInterface<T, U>

  constructor(
    lifecycle: U,
    handler: UploadHandlerInterface<T, U>
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
