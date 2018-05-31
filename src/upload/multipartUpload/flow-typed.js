/* @flow */

import type {Request, ProgressListener, Headers, FileData} from '../types'

export type {ProgressListener, Headers, FileData}

export type Options = {
  headers?: Headers,
}

export type AWSResponse = {
  code: number,
}

export type AWSRequest = Request<AWSResponse>
