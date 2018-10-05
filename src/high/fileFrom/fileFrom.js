/* @flow */
import type {FileData, UCFile} from '../../flow-typed'
import type {Options} from './flow-typed'
import {simpleUpload} from './simpleUpload'
import {isFileData} from '../../util/checkers'

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

  if (typeof input !== 'string' && isFileData(input)) {
    return simpleUpload(input, options)
  }
}
