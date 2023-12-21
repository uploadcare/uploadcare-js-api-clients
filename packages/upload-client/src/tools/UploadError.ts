import { UploadcareError } from '@uploadcare/api-client-utils'
import { Headers, ErrorRequestInfo } from '../request/types'
import type { ServerErrorCode } from './ServerErrorCode'

export type ErrorResponseInfo = {
  error?: {
    statusCode: number
    content: string
    errorCode: ServerErrorCode
  }
}

export class UploadError extends UploadcareError {
  readonly code?: ServerErrorCode
  readonly request?: ErrorRequestInfo
  readonly response?: ErrorResponseInfo
  readonly headers?: Headers

  constructor(
    message: string,
    code?: ServerErrorCode,
    request?: ErrorRequestInfo,
    response?: ErrorResponseInfo,
    headers?: Headers
  ) {
    super()

    this.name = 'UploadError'
    this.message = message
    this.code = code
    this.request = request
    this.response = response
    this.headers = headers

    Object.setPrototypeOf(this, UploadError.prototype)
  }
}
