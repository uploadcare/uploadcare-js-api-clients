import {FileData, UploadcareGroupInterface} from '../types'
import {GroupUploadLifecycleInterface, UploadInterface} from '../lifecycle/types'
import {Url, Uuid} from '..'
import {isFileData, isUrl, isUuid} from '../fileFrom/types'

/**
 * Base `thenable` interface for uploading `groupFrom` (`object`, `url`, `input`, `uploaded`).
 */
export interface GroupUploadInterface extends UploadInterface<UploadcareGroupInterface> {}

// export interface GroupHandlerInterface extends UploadHandlerInterface<UploadcareGroupInterface> {}

export interface GroupHandlerInterface {
  upload(groupUploadLifecycle: GroupUploadLifecycleInterface): Promise<UploadcareGroupInterface>;
  cancel(groupUploadLifecycle: GroupUploadLifecycleInterface): void;
}

/**
 * FileData type guard.
 *
 * @param {FileData | Url | Uuid} data
 */
export const isFileDataArray = (data: FileData[] | Url[] | Uuid[]): data is FileData[] => {
  for (const item of data) {
    if (!isFileData(item)) {
      return false
    }
  }

  return true
}

/**
 * Uuid type guard.
 *
 * @param {FileData | Url | Uuid} data
 */
export const isUuidArray = (data: FileData[] | Url[] | Uuid[]): data is Uuid[] => {
  for (const item of data) {
    if (!isUuid(item)) {
      return false
    }
  }

  return true
}

/**
 * Url type guard.
 *
 * @param {FileData | Url | Uuid} data
 */
export const isUrlArray = (data: FileData[] | Url[] | Uuid[]): data is Url[] => {
  for (const item of data) {
    if (!isUrl(item)) {
      return false
    }
  }

  return true
}
