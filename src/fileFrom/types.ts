import { Url, Uuid } from '..'
import { isNode } from '../tools/isNode'
import { FileData } from '../api/types'

/**
 * FileData type guard.
 *
 * @param {FileData | Url | Uuid} data
 */
export const isFileData = (data: FileData | Url | Uuid): data is FileData => {
  return (
    data !== undefined &&
    ((!isNode() && data instanceof Blob) ||
      (!isNode() && data instanceof File) ||
      (isNode() && data instanceof Buffer))
  )
}

/**
 * Uuid type guard.
 *
 * @param {FileData | Url | Uuid} data
 */
export const isUuid = (data: FileData | Url | Uuid): data is Uuid => {
  const UUID_REGEX =
    '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
  const regExp = new RegExp(UUID_REGEX)

  return !isFileData(data) && regExp.test(data)
}

/**
 * Url type guard.
 *
 * @param {FileData | Url | Uuid} data
 */
export const isUrl = (data: FileData | Url | Uuid): data is Url => {
  const URL_REGEX =
    '^(?:\\w+:)?\\/\\/([^\\s\\.]+\\.\\S{2}|localhost[\\:?\\d]*)\\S*$'
  const regExp = new RegExp(URL_REGEX)

  return !isFileData(data) && regExp.test(data)
}
