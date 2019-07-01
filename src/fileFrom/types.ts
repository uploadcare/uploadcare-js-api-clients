import {UploadcareFile} from '../types'
import {CancelableInterface} from '../api/types'
import {UploadingProgress} from '../types'

export enum FileFrom {
  Object = 'object',
  URL = 'url',
  DOM = 'input',
  Uploaded = 'uploaded',
}

/**
 * Base `thenable` interface for uploading `fileFrom` (`object`, `url`, `input`, `uploaded`).
 */
export interface UploadFromInterface extends Promise<UploadcareFile>, CancelableInterface {
  onProgress: ((progress: UploadingProgress) => void) | null
  onUploaded: ((uuid: string) => void) | null
  onReady: ((file: UploadcareFile) => void) | null
  onCancel: VoidFunction | null
}
