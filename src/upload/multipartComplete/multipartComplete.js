/* @flow */

import type {UCRequest} from '../types'
import {request} from '../request'

import type {MultipartCompleteResponse, Options} from './flow-typed'

/**
 * Perfroms request to the /multipart/complete/ endpoint
 *
 * @export
 * @param {string} uuid
 * @param {Options} options
 * @returns {UCRequest}
 */
export function multipartComplete(
  uuid: string,
  options: Options,
): UCRequest<MultipartCompleteResponse> {
  return request('POST', 'multipart/complete', {
    body: {
      uuid: uuid,
      UPLOADCARE_PUB_KEY: options.publicKey,
    },
  })
}
