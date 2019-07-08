import {Settings, UploadcareGroupInterface, UploadingProgress, ProgressState, ProgressParams} from '../types'
import {Thenable} from '../tools/Thenable'
import {GroupInfo} from '../api/types'
import {PollPromiseInterface} from '../tools/poll'
import {InfoResponse} from '../api/info'
import {GroupUploadInterface} from './types'
import {UploadcareGroup} from '../UploadcareGroup'

/**
 * Base abstract `thenable` implementation of `GroupUploadInterface`.
 * You need to use this as base class for all uploading methods of `fileFrom`.
 * All that you need to implement — `promise` property and `cancel` method.
 */
export abstract class UploadFrom extends Thenable<UploadcareGroupInterface> implements GroupUploadInterface {
  protected abstract readonly promise: Promise<UploadcareGroupInterface>
  protected isFileReadyPolling: PollPromiseInterface<InfoResponse> | null = null
  abstract cancel(): void

  protected progress: UploadingProgress = {
    state: ProgressState.Pending,
    uploaded: null,
    value: 0,
  }
  protected group: UploadcareGroupInterface | null = null

  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((group: UploadcareGroupInterface) => void) | null = null
  onCancel: VoidFunction | null = null

  protected constructor() {
    super()
    this.handleCancelling = this.handleCancelling.bind(this)
  }

  protected setProgress(state: ProgressState, progress?: ProgressParams) {
    switch (state) {
      case ProgressState.Pending:
        this.progress = {
          state: ProgressState.Pending,
          uploaded: null,
          value: 0,
        }
        break
      case ProgressState.Uploading:
        this.progress = {
          state: ProgressState.Uploading,
          uploaded: progress || null,
          // leave 1 percent for uploaded and 1 for ready on cdn
          value: progress ? Math.round((progress.loaded * 98) / progress.total) : 0,
        }
        break
      case ProgressState.Uploaded:
        this.progress = {
          state: ProgressState.Uploaded,
          uploaded: null,
          value: 99,
        }
        break
      case ProgressState.Ready:
        this.progress = {
          state: ProgressState.Ready,
          uploaded: null,
          value: 100,
        }
        break
      case ProgressState.Canceled:
        this.progress = {
          state: ProgressState.Canceled,
          uploaded: null,
          value: 0,
        }
        break
      case ProgressState.Error:
        this.progress = {
          state: ProgressState.Error,
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
    this.setProgress(ProgressState.Canceled)

    if (typeof this.onCancel === 'function') {
      this.onCancel()
    }
  }

  /**
   * Handle file uploading.
   * @param {ProgressParams} progress
   */
  protected handleUploading(progress?: ProgressParams): void {
    this.setProgress(ProgressState.Uploading, progress)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }
  }

  /**
   * Handle uploaded file.
   * @param {GroupInfo} groupInfo
   * @param {Settings} settings
   */
  protected handleUploaded(groupInfo: GroupInfo, settings: Settings): Promise<UploadcareGroupInterface> {
    this.setGroup(new UploadcareGroup(groupInfo))

    this.setProgress(ProgressState.Uploaded)

    if (typeof this.onUploaded === 'function') {
      this.onUploaded(this.getGroup().uuid)
    }

    return Promise.resolve(this.getGroup())
  }

  /**
   * Handle uploaded file that ready on CDN.
   */
  protected handleReady = (): Promise<UploadcareGroupInterface> => {
    this.setProgress(ProgressState.Ready)

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
  protected handleError = (error) => {
    this.setProgress(ProgressState.Error)

    if (error.name === 'CancelError') {
      this.handleCancelling()
    }

    return Promise.reject(error)
  }
}
