/* @flow */
import type {UCRequest} from '../request/flow-typed'
import {request} from '../request'

export type Options = {
  publicKey: string,
}

/**
 * Getting file group info.
 * @export
 * @param {string} groupId Look like UUID~N, where N stands for a number of files in a group
 * @param {Options} options Set of options.
 * @returns {UCRequest}
 */
export function groupInfo(groupId: string, options: Options): UCRequest {
  return request('GET', 'group/info/', {
    query: {
      group_id: groupId,
      pub_key: options.publicKey,
    },
  })
}
