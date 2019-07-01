import {ProgressParams, ProgressState, UploadcareFile, UploadcareGroup, UploadingProgress} from '../types'
import {UploadLifecycleInterface, UploadFileLifecycleInterface, UploadGroupLifecycleInterface} from './types'

abstract class UploadLifecycle<T> implements UploadLifecycleInterface<T> {
  protected progress: UploadingProgress = {
    state: ProgressState.Pending,
    uploaded: null,
    value: 0,
  }
  protected entity: T | null = null

  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((entity: T) => void) | null = null
  onCancel: VoidFunction | null = null

  updateProgress(state: ProgressState, progress?: ProgressParams): void {
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

  getProgress(): UploadingProgress {
    return this.progress
  }

  updateEntity(entity: T): void {
    this.entity = entity
  }

  getEntity(): T {
    if (this.entity === null) {
      throw new Error('Entity is not ready yet.')
    }

    return this.entity
  }

  handleUploading(progress?: ProgressParams): void {
    this.updateProgress(ProgressState.Uploading, progress)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }
  }

  handleCancelling(): void {
    this.updateProgress(ProgressState.Canceled)

    if (typeof this.onCancel === 'function') {
      this.onCancel()
    }
  }

  handleReady(): Promise<T> {
    this.updateProgress(ProgressState.Ready)

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }

    if (typeof this.onReady === 'function') {
      this.onReady(this.getEntity())
    }

    return Promise.resolve(this.getEntity())
  }

  handleError(error: Error) {
    this.updateProgress(ProgressState.Error)

    if (error.name === 'CancelError') {
      this.handleCancelling()
    }

    return Promise.reject(error)
  }
}

export class UploadFileLifecycle extends UploadLifecycle<UploadcareFile> implements UploadFileLifecycleInterface {

}

export class UploadGroupLifecycle extends UploadLifecycle<UploadcareGroup> implements UploadGroupLifecycleInterface {

}
