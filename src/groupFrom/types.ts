import {UploadcareGroupInterface} from '../types'
import {UploadInterface} from '../lifecycle/types'
import {HandlerInterface} from '../fileFrom/types'

export enum GroupFromEnum {
  Object = 'object',
  URL = 'url',
  DOM = 'input',
  Uploaded = 'uploaded',
}

/**
 * Base `thenable` interface for uploading `groupFrom` (`object`, `url`, `input`, `uploaded`).
 */
export interface GroupUploadInterface extends UploadInterface<UploadcareGroupInterface> {}

export interface GroupHandlerInterface extends HandlerInterface<UploadcareGroupInterface> {}
