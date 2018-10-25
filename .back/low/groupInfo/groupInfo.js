/* @flow */
import type {UCSimpleRequest} from '../../flow-typed'

import {request} from '../request'
import type {Options, GroupInfoResponse} from './flow-typed'

/**
 * Getting file group info.
 * @export
 * @param {string} groupId Look like UUID~N, where N stands for a number of files in a group
 * @param {Options} options Set of options.
 * @returns {UCSimpleRequest}
 */
export function groupInfo(groupId: string, options: Options): UCSimpleRequest<GroupInfoResponse> {
  return request('GET', 'group/info/', {
    query: {
      group_id: groupId,
      pub_key: options.publicKey,
    },
  }).promise
}
