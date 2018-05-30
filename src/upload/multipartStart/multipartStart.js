/* @flow */

import type {UCRequest} from '../request/flow-typed'
import {request} from '../request'

export type Options = {
  contentType?: string,
  expire?: number,
  filename: string,
  partSize?: number,
  publicKey: string,
  signature?: string,
  size: number,
  source?: string,
  store?: boolean | 'auto',
}

const defaultOptions: $Shape<Options> = {
  contentType: 'application/octet-stream',
  partSize: 5242880,
  source: 'local',
}

/**
 *
 *
 * @export
 * @param {Options} opts
 * @returns {UCRequest}
 */
export function multipartStart(opts: Options): UCRequest {
  const options = {
    ...defaultOptions,
    ...opts,
  }

  return request('POST', 'multipart/start', {
    body: {
      content_type: options.contentType,
      expire: options.expire,
      filename: options.filename,
      partSize: options.partSize,
      signature: options.signature,
      size: options.size,
      source: options.source,
      UPLOADCARE_PUB_KEY: options.publicKey,
      UPLOADCARE_STORE: options.store,
    },
  })
}
