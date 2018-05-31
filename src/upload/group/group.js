/* @flow */
import type {UCRequest} from '../request/flow-typed'
import {request} from '../request'

export type UUID = string
export type CDNUrl = string
export type Options = {
  publicKey: string,
}

/**
 * Making a group.
 * @export
 * @param {Array<UUID | CDNUrl>} files Array, where each parameter can be a file UUID or a CDN URL,
 * with or without applied Media Processing operations.
 * @param {Options} options Set of options.
 * @returns {UCRequest}
 */
export function group(files: Array<UUID | CDNUrl>, options: Options): UCRequest {
  return request('POST', 'group', {
    body: {
      files,
      pub_key: options.publicKey,
    },
  })
}
