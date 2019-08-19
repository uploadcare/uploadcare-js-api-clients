import {UploadcareGroupInterface, UploadingProgress, ProgressStateEnum, ProgressParamsInterface} from '../types'
import {Thenable} from '../thenable/Thenable'
import {GroupInfoInterface} from '../api/types'
import {UploadcareGroup} from '../UploadcareGroup'
import {UploadInterface} from '../lifecycle/types'

/**
 * Base abstract `thenable` implementation of `UploadInterface<UploadcareGroupInterface>`.
 * You need to use this as base class for all uploading methods of `fileFrom`.
 * All that you need to implement — `promise` property and `cancel` method.
 */
export abstract class UploadFrom extends Thenable<UploadcareGroupInterface> implements UploadInterface<UploadcareGroupInterface> {
  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((group: UploadcareGroupInterface) => void) | null = null
  onCancel: (() => void) | null = null

  abstract cancel(): void

  protected abstract readonly promise: Promise<UploadcareGroupInterface>
  protected isCancelled = false

  private progress: UploadingProgress = {
    state: ProgressStateEnum.Pending,
    uploaded: null,
    value: 0,
  }
  private group: UploadcareGroupInterface | null = null

  protected constructor() {
    super()
    this.handleCancelling = this.handleCancelling.bind(this)
  }

  protected setProgress(state: ProgressStateEnum, progress?: ProgressParamsInterface): void {
    switch (state) {
      case ProgressStateEnum.Pending:
        this.progress = {
          state: ProgressStateEnum.Pending,
          uploaded: null,
          value: 0,
        }
        break
      case ProgressStateEnum.Uploading:
        this.progress = {
          state: ProgressStateEnum.Uploading,
          uploaded: progress || null,
          // leave 1 percent for uploaded and 1 for ready on cdn
          value: progress ? Math.round((progress.loaded / progress.total) * 0.98) : 0,
        }
        break
      case ProgressStateEnum.Uploaded:
        this.progress = {
          state: ProgressStateEnum.Uploaded,
          uploaded: null,
          value: 0.99,
        }
        break
      case ProgressStateEnum.Ready:
        this.progress = {
          state: ProgressStateEnum.Ready,
          uploaded: null,
          value: 1,
        }
        break
      case ProgressStateEnum.Canceled:
        this.progress = {
          state: ProgressStateEnum.Canceled,
          uploaded: null,
          value: 0,
        }
        break
      case ProgressStateEnum.Error:
        this.progress = {
          state: ProgressStateEnum.Error,
          uploaded: null,
          value: 0,
        }
        break
    }
  }

  protected getProgress(): UploadingProgress {
    return this.progress
  }

  protected setGroup(group: UploadcareGroupInterface) {
    this.group = group
  }

  protected getGroup(): UploadcareGroupInterface {
    return this.group as UploadcareGroupInterface
  }

  /**
   * Handle cancelling of uploading file.
   */
  protected handleCancelling(): void {
    this.setProgress(ProgressStateEnum.Canceled)

    if (typeof this.onCancel === 'function') {
      this.onCancel()
    }
  }

  /**
   * Handle file uploading.
   * @param {ProgressParamsInterface} progress
   */
  protected handleUploading(progress?: ProgressParamsInterface): void {
    this.setProgress(ProgressStateEnum.Uploading, progress)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }
  }

  /**
   * Handle uploaded file.
   * @param {GroupInfoInterface} groupInfo
   */
  protected handleUploaded(groupInfo: GroupInfoInterface): Promise<UploadcareGroupInterface> {
    this.setGroup(new UploadcareGroup(groupInfo))

    this.setProgress(ProgressStateEnum.Uploaded)

    if (typeof this.onUploaded === 'function') {
      this.onUploaded(this.getGroup().uuid)
    }

    return Promise.resolve(this.getGroup())
  }

  /**
   * Handle uploaded file that ready on CDN.
   */
  protected handleReady = (): Promise<UploadcareGroupInterface> => {
    this.setProgress(ProgressStateEnum.Ready)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }

    if (typeof this.onReady === 'function') {
      this.onReady(this.getGroup())
    }

    return Promise.resolve(this.getGroup())
  }

  /**
   * Handle uploading error
   * @param error
   */
  protected handleError = (error): Promise<void | Error> => {
    if (error.name === 'CancelError') {
      this.handleCancelling()
    } else {
      this.setProgress(ProgressStateEnum.Error)
    }

    return Promise.reject(error)
  }
}
