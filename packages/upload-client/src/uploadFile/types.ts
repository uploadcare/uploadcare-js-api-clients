import { Url, Uuid } from '..'
import { SupportedFileInput, Sliceable } from '../types'
import { isFileData } from '../tools/isFileData'

/** Uuid type guard. */
export const isUuid = (data: SupportedFileInput | Url | Uuid): data is Uuid => {
  const UUID_REGEX =
    '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
  const regExp = new RegExp(UUID_REGEX)

  return !isFileData(data) && regExp.test(data)
}

/**
 * Url type guard.
 *
 * @param {SupportedFileInput | Url | Uuid} data
 */
export const isUrl = (data: SupportedFileInput | Url | Uuid): data is Url => {
  const URL_REGEX =
    '^(?:\\w+:)?\\/\\/([^\\s\\.]+\\.\\S{2}|localhost[\\:?\\d]*)\\S*$'
  const regExp = new RegExp(URL_REGEX)

  return !isFileData(data) && regExp.test(data)
}

export type PrepareChunks = (
  file: SupportedFileInput,
  fileSize: number,
  chunkSize: number
) => Promise<(index: number) => Sliceable>
