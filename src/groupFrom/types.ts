import {UploadcareFiles, UploadcareGroup, UploadingProgress} from '../types'
import {CancelableInterface} from '../api/types'

export enum GroupFrom {
  Object = 'object',
  URL = 'url',
  DOM = 'input',
  Uploaded = 'uploaded',
}

/**
 * Base `thenable` interface for uploading `filesGroupFrom` (`object`, `url`, `input`, `uploaded`).
 */
export interface UploadGroupFromInterface extends Promise<UploadcareGroup>, CancelableInterface {
  onProgress: ((progress: UploadingProgress) => void) | null
  onUploaded: ((uuid: string) => void) | null
  onReady: ((group: UploadcareGroup) => void) | null
  onCancel: VoidFunction | null

  getFiles(): Promise<UploadcareFiles>
}
