import { UploadingState } from "./state/UploadingState"
import { CancelledState } from "./state/CancelledState"
import { ReadyState } from "./state/ReadyState"
import { ErrorState } from "./state/ErrorState"
import { PendingState } from "./state/PendingState"
import StateChangeError from "../errors/StateChangeError"
import EntityIsNotReadyError from "../errors/EntityIsNotReadyError"
import { UploadedState } from "./state/UploadedState"

/* Types */
import { ProgressParamsInterface, UploadingProgress } from "../types"
import {
  LifecycleHooksInterface,
  LifecycleInterface,
  LifecycleStateInterface
} from "./types"
import { Uuid } from ".."

export class UploadLifecycle<T> implements LifecycleInterface<T> {
  private state: LifecycleStateInterface
  private entity: T | null = null

  private readonly onProgress: ((progress: UploadingProgress) => void) | null
  private readonly onUploaded: ((uuid: string) => void) | null
  private readonly onReady: ((entity: T) => void) | null
  private readonly onCancel: (() => void) | null

  constructor(hooks?: LifecycleHooksInterface<T>) {
    this.state = new PendingState()

    this.onProgress = (hooks && hooks.onProgress) || null
    this.onUploaded = (hooks && hooks.onUploaded) || null
    this.onReady = (hooks && hooks.onReady) || null
    this.onCancel = (hooks && hooks.onCancel) || null
  }

  updateState(state: LifecycleStateInterface): void {
    if (this.state.isCanBeChangedTo(state)) {
      this.state = state
    } else {
      const fromState = this.state.progress.state
      const toState = state.progress.state

      throw new StateChangeError(fromState, toState)
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
      throw new EntityIsNotReadyError()
    }

    return this.entity
  }

  handleUploading(progress?: ProgressParamsInterface): void {
    this.updateState(new UploadingState(progress))

    if (typeof this.onProgress === "function") {
      this.onProgress(this.getProgress())
    }
  }

  handleCancelling(): void {
    this.updateState(new CancelledState())

    if (typeof this.onCancel === "function") {
      this.onCancel()
    }
  }

  handleUploaded(uuid: Uuid): T {
    this.updateState(new UploadedState())

    if (typeof this.onProgress === "function") {
      this.onProgress(this.getProgress())
    }

    if (typeof this.onUploaded === "function") {
      this.onUploaded(uuid)
    }

    return this.getEntity()
  }

  handleReady(): T {
    this.updateState(new ReadyState())

    if (typeof this.onProgress === "function") {
      this.onProgress(this.getProgress())
    }

    if (typeof this.onReady === "function") {
      this.onReady(this.getEntity())
    }

    return this.getEntity()
  }

  handleError(error: Error): Promise<never> {
    if (error.name === "CancelError") {
      this.handleCancelling()
    } else {
      this.updateState(new ErrorState())
    }

    return Promise.reject(error)
  }
}
