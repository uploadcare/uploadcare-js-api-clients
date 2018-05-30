/* @flow */

import type {UCRequest} from '../request/flow-typed'
import {request} from '../request'

export type Options = {
  publicKey: string,
}

/**
 * Perfroms request to the /multipart/complete/ endpoint
 *
 * @export
 * @param {string} uuid
 * @param {Options} options
 * @returns {UCRequest}
 */
export function multipartComplete(uuid: string, options: Options): UCRequest {
  return request('POST', 'multipart/complete', {
    body: {
      uuid: uuid,
      UPLOADCARE_PUB_KEY: options.publicKey,
    },
  })
}
