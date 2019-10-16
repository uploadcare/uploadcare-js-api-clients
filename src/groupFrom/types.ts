import {UploadcareGroupInterface} from '../types'
import {UploadInterface} from '../lifecycle/types'
import {UploadHandlerInterface} from '../fileFrom/types'

/**
 * Base `thenable` interface for uploading `groupFrom` (`object`, `url`, `input`, `uploaded`).
 */
export interface GroupUploadInterface extends UploadInterface<UploadcareGroupInterface> {}

export interface GroupHandlerInterface extends UploadHandlerInterface<UploadcareGroupInterface> {}
