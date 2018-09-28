/* @flow */

import type {UCSimpleRequest} from '../types'
import {request} from '../request'

import type {MultipartStartResponse, Options} from './flow-typed'

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
 * @returns {UCSimpleRequest}
 */
export function multipartStart(opts: Options): UCSimpleRequest<MultipartStartResponse> {
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
  }).promise
}
