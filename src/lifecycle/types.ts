import {ProgressParams, ProgressState, Settings, UploadcareFile, UploadcareGroup, UploadingProgress} from '../types'
import {Uuid} from '..'

export interface UploadLifecycleInterface<T> {
  onProgress: ((progress: UploadingProgress) => void) | null
  onUploaded: ((uuid: string) => void) | null
  onReady: ((entity: T) => void) | null
  onCancel: VoidFunction | null

  updateProgress(state: ProgressState, progress?: ProgressParams): void
  getProgress(): UploadingProgress
  updateEntity(entity: T): void
  getEntity(): T
  handleUploading(progress?: ProgressParams): void
  handleCancelling(): void
  handleReady(): Promise<T>
  handleError(error: Error): void
}

export interface UploadFileLifecycleInterface extends UploadLifecycleInterface<UploadcareFile> {
  handleUploadedFile(uuid: Uuid, settings: Settings): Promise<UploadcareFile>
}

export interface UploadGroupLifecycleInterface extends UploadLifecycleInterface<UploadcareGroup> {
  handleUploadedGroup(uuid: Uuid, settings: Settings): Promise<UploadcareGroup>
}
