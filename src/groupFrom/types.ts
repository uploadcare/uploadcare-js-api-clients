import { FileData } from "../types"
import { Url, Uuid } from ".."
import { isFileData, isUrl, isUuid } from "../fileFrom/types"

/**
 * FileData type guard.
 *
 * @param {FileData | Url | Uuid} data
 */
export const isFileDataArray = (
  data: FileData[] | Url[] | Uuid[]
): data is FileData[] => {
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
export const isUuidArray = (
  data: FileData[] | Url[] | Uuid[]
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
 *
 * @param {FileData | Url | Uuid} data
 */
export const isUrlArray = (
  data: FileData[] | Url[] | Uuid[]
): data is Url[] => {
  for (const item of data) {
    if (!isUrl(item)) {
      return false
    }
  }

  return true
}
