import { Url, Uuid } from '../api/types'
import { SupportedFileInput } from '../types'
import { isFileData } from '../tools/isFileData'
import { isUrl, isUuid } from '../uploadFile/types'

/**
 * FileData type guard.
 */
export const isFileDataArray = (
  data: SupportedFileInput[] | Url[] | Uuid[]
): data is SupportedFileInput[] => {
  for (const item of data) {
    if (!isFileData(item)) {
      return false
    }
  }

  return true
}

/**
 * Uuid type guard.
 */
export const isUuidArray = (
  data: SupportedFileInput[] | Url[] | Uuid[]
): data is Uuid[] => {
  for (const item of data) {
    if (!isUuid(item)) {
      return false
    }
  }

  return true
}

/**
 * Url type guard.
 */
export const isUrlArray = (
  data: SupportedFileInput[] | Url[] | Uuid[]
): data is Url[] => {
  for (const item of data) {
    if (!isUrl(item)) {
      return false
    }
  }

  return true
}
