import {ProgressParams, Settings, UploadcareFile, UploadcareGroup, UploadingProgress} from '../types'
import {Uuid} from '..'
import {CancelableInterface, GroupInfo} from '../api/types'

export interface HooksInterface<T> {
  onProgress: ((progress: UploadingProgress) => void) | null
  onUploaded: ((uuid: string) => void) | null
  onReady: ((entity: T) => void) | null
  onCancel: VoidFunction | null
}

export interface UploadInterface<T> extends
  Promise<T>,
  HooksInterface<T>,
  CancelableInterface {
}

export interface LifecycleStateInterface {
  readonly progress: UploadingProgress
  isCanBeChangedTo(state: LifecycleStateInterface): boolean
}

export interface LifecycleInterface<T> extends HooksInterface<T> {
  updateState(state: LifecycleStateInterface): void
  getProgress(): UploadingProgress
  updateEntity(entity: T): void
  getEntity(): T
  handleUploading(progress?: ProgressParams): void
  handleCancelling(): void
  handleReady(): Promise<T>
  handleError(error: Error): void
}

export interface FileUploadLifecycleInterface {
  getUploadLifecycle(): LifecycleInterface<UploadcareFile>
  handleUploadedFile(uuid: Uuid, settings: Settings): Promise<UploadcareFile>
}

export interface GroupUploadLifecycleInterface {
  getUploadLifecycle(): LifecycleInterface<UploadcareGroup>
  handleUploadedGroup(groupInfo: GroupInfo, settings: Settings): Promise<UploadcareGroup>
}
