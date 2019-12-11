import {
  ProgressParamsInterface,
  SettingsInterface,
  UploadcareFileInterface,
  UploadcareGroupInterface,
  UploadingProgress
} from "../types"
import { Uuid } from ".."
import { FileInfoInterface, GroupInfoInterface } from "../api/types"
import { PollPromiseInterface } from "../tools/poll"

export interface CancelableInterface {
  cancel(): void
}

export type ProgressHook<T> = (progress: T) => void
export type CancelHook = () => void
export type UploadedHook = (uuid: string) => void
export type ReadyHook<T> = (entity: T) => void

export interface ProgressHookInterface<T> {
  onProgress?: ProgressHook<T> | null
}

export interface CancelHookInterface {
  onCancel?: CancelHook | null
}

export interface BaseHooksInterface
  extends ProgressHookInterface<ProgressEvent>,
    CancelHookInterface {}

export interface UploadHooksInterface<T>
  extends ProgressHookInterface<UploadingProgress> {
  onUploaded?: UploadedHook | null
  onReady?: ReadyHook<T> | null
}

export interface LifecycleHooksInterface<T>
  extends UploadHooksInterface<T>,
    CancelHookInterface {}

export interface UploadInterface<T> extends Promise<T>, CancelableInterface {}

export interface LifecycleStateInterface {
  readonly progress: UploadingProgress

  isCanBeChangedTo(state: LifecycleStateInterface): boolean
}

export interface LifecycleInterface<T> {
  updateState(state: LifecycleStateInterface): void
  getProgress(): UploadingProgress
  updateEntity(entity: T): void
  getEntity(): T
  handleUploading(progress?: ProgressParamsInterface): void
  handleCancelling(): void
  handleUploaded(uuid: Uuid): T
  handleReady(): T
  handleError(error: Error): Promise<never>
}

export interface UploadHandlerInterface<T, U> {
  upload(entityUploadLifecycle: U): Promise<T>
  cancel(entityUploadLifecycle: U): void
}

export interface FileUploadLifecycleInterface {
  readonly uploadLifecycle: LifecycleInterface<UploadcareFileInterface>

  getIsFileReadyPolling(): PollPromiseInterface<FileInfoInterface> | null
  handleUploadedFile(
    uuid: Uuid,
    settings: SettingsInterface
  ): Promise<UploadcareFileInterface>
}

export interface GroupUploadLifecycleInterface {
  readonly uploadLifecycle: LifecycleInterface<UploadcareGroupInterface>

  handleUploadedGroup(
    groupInfo: GroupInfoInterface,
    settings: SettingsInterface
  ): Promise<UploadcareGroupInterface>
}
