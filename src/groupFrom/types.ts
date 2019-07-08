import {UploadcareGroupInterface} from '../types'
import {UploadInterface} from '../lifecycle/types'

export enum GroupFrom {
  Object = 'object',
  URL = 'url',
  DOM = 'input',
  Uploaded = 'uploaded',
}

/**
 * Base `thenable` interface for uploading `groupFrom` (`object`, `url`, `input`, `uploaded`).
 */
export interface GroupUploadInterface extends UploadInterface<UploadcareGroupInterface> {}
