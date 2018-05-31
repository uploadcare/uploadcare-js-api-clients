/* @flow */

import type {Request, Headers} from '../types'

export type Options = {
  headers?: Headers,
}

export type AWSResponse = {
  code: number,
}

export type AWSRequest = Request<AWSResponse>
