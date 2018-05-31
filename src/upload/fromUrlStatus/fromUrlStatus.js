/* @flow */
import type {UCRequest} from '../request/flow-typed'
import {request} from '../request'

/**
 * Checking upload status and working with file tokens.
 * @export
 * @param {string} token File token to recieve an actual file UUID.
 * @returns {UCRequest}
 */
export function fromUrlStatus(token: string): UCRequest {
  return request('GET', 'from_url/status/', {query: {token: token}})
}
