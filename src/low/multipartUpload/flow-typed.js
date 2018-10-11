/* @flow */

import type {Request, Headers} from '../../flow-typed'

export type Options = {
  headers?: Headers,
}

export type MultipartUploadResponse = {
  code: number,
}

export type MultipartUploadRequest = Request<MultipartUploadResponse>
