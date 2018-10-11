/* @flow */
import type {FileInfo} from '../../flow-typed'
import {isBlob, isFile, isBuffer, isArrayBuffer} from '../../util/checkers'
import type {Options} from './flow-typed'

/**
 *
 *
 * @export
 * @param {(FileData | string)} input
 */
export function extractInfo(input: any, options: Options): $Shape<FileInfo> {
  const fileInfo: $Shape<FileInfo> = {
    filename: options.filename,
    mime_type: options.contentType,
  }

  const setProp = (key: string, value: mixed) =>
    typeof value !== 'undefined' && (fileInfo[key] = value)

  if (typeof input === 'string') {
    setProp('uuid', input)
  }
  else if (isFile(input)) {
    setProp('filename', input.name)
    setProp('size', input.size)
    setProp('mime_type', input.type)
  }
  else if (isBlob(input)) {
    setProp('mime_type', input.type)
    setProp('size', input.size)
  }
  else if (isBuffer(input)) {
    setProp('size', input.length)
  }
  else if (isArrayBuffer(input)) {
    setProp('size', input.byteLength)
  }

  return fileInfo
}
