/* @flow */

import type {Request, Headers} from '../types'

export type Options = {
  headers?: Headers,
}

export type MultipartUploadResponse = {
  code: number,
}

export type MultipartUploadRequest = Request<MultipartUploadResponse>
