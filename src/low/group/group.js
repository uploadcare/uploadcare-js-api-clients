/* @flow */
import type {UCSimpleRequest} from '../../flow-typed'

import {request} from '../request'
import type {UUID, CDNUrl, Options, GroupResponse} from './flow-typed'

/**
 * Making a group.
 * @export
 * @param {Array<UUID | CDNUrl>} files Array, where each parameter can be a file UUID or a CDN URL,
 * with or without applied Media Processing operations.
 * @param {Options} options Set of options.
 * @returns {UCSimpleRequest}
 */
export function group(
  files: Array<UUID | CDNUrl>,
  options: Options,
): UCSimpleRequest<GroupResponse> {
  return request('POST', 'group', {
    body: {
      files: files,
      pub_key: options.publicKey,
    },
  }).promise
}
