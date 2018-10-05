/* @flow */
import type {UCSimpleRequest} from '../../flow-typed'

import {request} from '../request'

import type {MultipartCompleteResponse, Options} from './flow-typed'

/**
 * Perfroms request to the /multipart/complete/ endpoint
 *
 * @export
 * @param {string} uuid
 * @param {Options} options
 * @returns {UCSimpleRequest}
 */
export function multipartComplete(
  uuid: string,
  options: Options,
): UCSimpleRequest<MultipartCompleteResponse> {
  return request('POST', 'multipart/complete', {
    body: {
      uuid: uuid,
      UPLOADCARE_PUB_KEY: options.publicKey,
    },
  }).promise
}
