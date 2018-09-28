/* @flow */
import type {UCSimpleRequest} from '../types'

import {request} from '../request'
import type {FromUrlResponse, Token} from './flow-typed'

/**
 * Checking upload status and working with file tokens.
 * @export
 * @param {Token} token File token to recieve an actual file UUID.
 * @returns {UCSimpleRequest}
 */
export function fromUrlStatus(token: Token): UCSimpleRequest<FromUrlResponse> {
  return request('GET', 'from_url/status/', {query: {token: token}}).promise
}
