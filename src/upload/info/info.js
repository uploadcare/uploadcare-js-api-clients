/* @flow */

import type {UCRequest} from '../types'
import {request} from '../request'

import type {InfoResponse, Options} from './flow-typed'

/**
 * Requesting file info.
 *
 * @export
 * @param {string} uuid UUID of a target file to request its info
 * @param {Options} options Options
 * @returns {UCRequest}
 */
export function info(uuid: string, options: Options): UCRequest<InfoResponse> {
  return request('GET', 'info', {
    query: {
      pub_key: options.publicKey,
      file_id: uuid,
    },
  })
}
