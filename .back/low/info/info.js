/* @flow */
import type {UCSimpleRequest} from '../../flow-typed'

import {request} from '../request'

import type {InfoResponse, Options} from './flow-typed'

/**
 * Requesting file info.
 *
 * @export
 * @param {string} uuid UUID of a target file to request its info
 * @param {Options} options Options
 * @returns {UCSimpleRequest}
 */
export function info(uuid: string, options: Options): UCSimpleRequest<InfoResponse> {
  return request('GET', 'info', {
    query: {
      pub_key: options.publicKey,
      file_id: uuid,
    },
  }).promise
}
