import {ProgressParams, UploadingProgress} from '../types'
import {
  LifecycleInterface,
  LifecycleStateInterface
} from './types'
import {UploadingState} from './UploadingState'
import {CancelledState} from './CancelledState'
import {ReadyState} from './ReadyState'
import {ErrorState} from './ErrorState'
import {PendingState} from './PendingState'

export class UploadLifecycle<T> implements LifecycleInterface<T> {
  protected state: LifecycleStateInterface
  protected entity: T | null = null

  onProgress: ((progress: UploadingProgress) => void) | null = null
  onUploaded: ((uuid: string) => void) | null = null
  onReady: ((entity: T) => void) | null = null
  onCancel: VoidFunction | null = null

  constructor() {
    this.state = new PendingState()
  }

  updateState(state: LifecycleStateInterface): void {
    if (this.state.isCanBeChangedTo(state)) {
      this.state = state
    } else {
      // TODO: Make a new Exception
      throw new Error(`${this.state.progress.state} can't be changed to ${state.progress.state}`)
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

  handleUploading(progress?: ProgressParams): void {
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

  handleError(error: Error) {
    this.updateState(new ErrorState())

    if (error.name === 'CancelError') {
      this.handleCancelling()
    }

    return Promise.reject(error)
  }
}
