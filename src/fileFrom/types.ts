import {UploadcareFile} from '../types'
import {UploadInterface} from '../lifecycle/types'

export enum FileFrom {
  Object = 'object',
  URL = 'url',
  DOM = 'input',
  Uploaded = 'uploaded',
}

/**
 * Base `thenable` interface for uploading `fileFrom` (`object`, `url`, `input`, `uploaded`).
 */
export interface FileUploadInterface extends UploadInterface<UploadcareFile> {}
