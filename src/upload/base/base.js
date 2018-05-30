/* @flow */

import type {UCRequest} from '../request/flow-typed'
import {request} from '../request'

export type Options = {
  publicKey: string,
  store: boolean | 'auto',
}

/**
 * Request wrapper for file uploading
 *
 * @export
 * @param {(File | Blob)} file
 * @param {Options} options
 * @returns {UCRequest}
 */
export function base(file: File | Blob, options: Options): UCRequest {
  return request('POST', 'base', {
    body: {
      file,
      UPLOADCARE_PUB_KEY: options.publicKey,
      UPLOADCARE_STORE: options.store ? options.store.toString() : undefined,
    },
  })
}
