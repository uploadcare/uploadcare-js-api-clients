import {UploadFromObject} from './UploadFromObject'
import {UploadFromUrl} from './UploadFromUrl'
import {UploadFromUploaded} from './UploadFromUploaded'
import {isFileData, isUrl, isUuid} from '../fileFrom/fileFrom'

/* Types */
import {FileData, SettingsInterface} from '../types'
import {Url} from '../api/fromUrl'
import {Uuid} from '../api/types'
import {GroupUploadInterface} from './types'

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

/**
 * Uploads file from provided data.
 *
 * @param {FileData} data
 * @param {SettingsInterface} settings
 * @throws Error
 * @returns {UploadInterface<UploadcareGroupInterface>}
 */
export default function groupFrom(data: FileData[] | Url[] | Uuid[], settings: SettingsInterface = {}): GroupUploadInterface {
  if (isFileDataArray(data)) {
    return new UploadFromObject(data, settings)
  }

  if (isUrlArray(data)) {
    return new UploadFromUrl(data, settings)
  }

  if (isUuidArray(data)) {
    return new UploadFromUploaded(data, settings)
  }

  throw new TypeError(`Group uploading from "${data}" is not supported`)
}
