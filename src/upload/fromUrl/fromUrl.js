/* @flow */
import type {UCSimpleRequest} from '../types'

import {request} from '../request'
import type {Options, FromUrlResponse} from './flow-typed'

/**
 * Uploading files from URL.
 * @export
 * @param {string} sourceUrl Source file URL, which should be a public HTTP or HTTPS link.
 * @param {Options} options Set of options.
 * @returns {UCSimpleRequest}
 */
export function fromUrl(
  sourceUrl: string,
  options: Options,
): UCSimpleRequest<FromUrlResponse> {
  return request('GET', 'from_url', {
    query: {
      source_url: sourceUrl,
      pub_key: options.publicKey,
      store: options.store ? options.store.toString() : undefined,
      filename: options.fileName ? options.fileName.toString() : undefined,
    },
  }).promise
}
