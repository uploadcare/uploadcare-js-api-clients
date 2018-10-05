/* @flow */

import type {UCRequest, FileData} from '../../flow-typed'
import {request} from '../request'
import type {Options, BaseResponse} from './flow-typed'

/**
 * Request wrapper for file uploading
 *
 * @export
 * @param {FileData} file
 * @param {Options} options
 * @returns {UCRequest}
 */
export function base(
  file: FileData,
  options: Options,
): UCRequest<BaseResponse> {
  return request('POST', 'base', {
    body: {
      file,
      UPLOADCARE_PUB_KEY: options.publicKey,
      UPLOADCARE_STORE: options.store ? options.store.toString() : undefined,
    },
  })
}
