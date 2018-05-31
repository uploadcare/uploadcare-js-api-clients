/* @flow */

import type {UCRequest} from '../types'
import {request} from '../request'
import type {Options, BaseResponse} from './flow-typed'

/**
 * Request wrapper for file uploading
 *
 * @export
 * @param {(File | Blob)} file
 * @param {Options} options
 * @returns {UCRequest}
 */
export function base(
  file: File | Blob,
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
