/* @flow */
import type {UCRequest} from '../types'
import {request} from '../request'
import type {FromUrlResponse, Token} from './flow-typed'

/**
 * Checking upload status and working with file tokens.
 * @export
 * @param {Token} token File token to recieve an actual file UUID.
 * @returns {UCRequest}
 */
export function fromUrlStatus(token: Token): UCRequest<FromUrlResponse> {
  return request('GET', 'from_url/status/', {query: {token: token}})
}
