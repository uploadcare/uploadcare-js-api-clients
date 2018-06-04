/* @flow */
import type {UCRequest} from '../types'
import {request} from '../request'
import type {UUID, CDNUrl, Options, GroupResponse} from './flow-typed'


/**
 * Making a group.
 * @export
 * @param {Array<UUID | CDNUrl>} files Array, where each parameter can be a file UUID or a CDN URL,
 * with or without applied Media Processing operations.
 * @param {Options} options Set of options.
 * @returns {UCRequest}
 */
export function group(
  files: Array<UUID | CDNUrl>,
  options: Options,
): UCRequest<GroupResponse> {
  return request('POST', 'group', {
    body: {
      files: files,
      pub_key: options.publicKey,
    },
  })
}
