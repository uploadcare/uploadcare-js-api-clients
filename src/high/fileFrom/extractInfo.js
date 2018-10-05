/* @flow */
import type {FileInfo} from '../../flow-typed'
import {isBlob, isFile, isBuffer, isArrayBuffer} from '../../util/checkers'

/**
 *
 *
 * @export
 * @param {(FileData | string)} input
 */
export function extractInfo(input: any): $Shape<FileInfo> {
  const fileInfo: $Shape<FileInfo> = {}

  if (typeof input === 'string') {
    fileInfo.uuid = input
  }
  else if (isFile(input)) {
    fileInfo.filename = input.name
    fileInfo.size = input.size
    fileInfo.mime_type = input.type
  }
  else if (isBlob(input)) {
    fileInfo.mime_type = input.type
    fileInfo.size = input.size
  }
  else if (isBuffer(input)) {
    fileInfo.size = input.length
  }
  else if (isArrayBuffer(input)) {
    fileInfo.size = input.byteLength
  }

  return fileInfo
}
