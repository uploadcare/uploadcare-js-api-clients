/* @flow */

import type {UCRequest} from '../request/flow-typed'
import {request} from '../request'

export type Options = {
  publicKey: string,
}

/**
 * Requesting file info.
 *
 * @export
 * @param {string} uuid UUID of a target file to request its info
 * @param {Options} options Options
 * @returns {UCRequest}
 */
export function info(uuid: string, options: Options): UCRequest {
  return request('GET', 'info', {
    query: {
      pub_key: options.publicKey,
      file_id: uuid,
    },
  })
}
