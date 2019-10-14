import {ProgressParamsInterface, UploadingProgress} from '../types'
import {
  LifecycleInterface,
  LifecycleStateInterface
} from './types'
import {UploadingState} from './state/UploadingState'
import {CancelledState} from './state/CancelledState'
import {ReadyState} from './state/ReadyState'
import {ErrorState} from './state/ErrorState'
import {PendingState} from './state/PendingState'

export class UploadLifecycle<T> implements LifecycleInterface<T> {
  private state: LifecycleStateInterface
  private entity: T | null = null

  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((entity: T) => void) | null = null
  onCancel: (() => void) | null = null

  constructor() {
    this.state = new PendingState()
  }

  updateState(state: LifecycleStateInterface): void {
    if (this.state.isCanBeChangedTo(state)) {
      this.state = state
    } else {
      // TODO: Make a new Exception
      throw new Error(`"${this.state.progress.state}" state can't be changed to "${state.progress.state}" state`)
    }
  }

  getProgress(): UploadingProgress {
    return this.state.progress
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

  handleUploading(progress?: ProgressParamsInterface): void {
    if (progress) {
      this.updateState(new UploadingState(progress))
    }

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }
  }

  handleCancelling(): void {
    this.updateState(new CancelledState())

    if (typeof this.onCancel === 'function') {
      this.onCancel()
    }
  }

  handleReady(): Promise<T> {
    this.updateState(new ReadyState())

    if (typeof this.onProgress === 'function') {
      this.onProgress(this.getProgress())
    }

    if (typeof this.onReady === 'function') {
      this.onReady(this.getEntity())
    }

    return Promise.resolve(this.getEntity())
  }

  handleError(error: Error): Promise<never> {
    if (error.name === 'CancelError') {
      this.handleCancelling()
    } else {
      this.updateState(new ErrorState())
    }

    return Promise.reject(error)
  }
}
