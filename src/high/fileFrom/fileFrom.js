/* @flow */
import type {FileData, UCFile} from '../../flow-typed'
import type {Options} from './flow-typed'
import {uploadSimple} from './uploadSimple/uploadSimple'
import {isFileData} from '../../util/checkers'
import {extractInfo} from './extractInfo'
import {uploadMultipart} from './uploadMultipart/uploadMultipart'

const defaultOptions: Options = {publicKey: 'demopublickey'}

/**
 *
 *
 * @export
 * @param {(FileData | string)} input
 * @param {Options} [opts]
 */
export function fileFrom(
  input: FileData | string,
  opts?: Options,
): UCFile | void {
  const options = {
    ...defaultOptions,
    ...opts,
  }

  const fileInfo = extractInfo(input)

  if (typeof input === 'string') {
    return
  }

  if (isFileData(input)) {
    if (fileInfo.size > 10000000) {
      return uploadMultipart(input, options)
    }

    return uploadSimple(input, options)
  }
}
