import { UploadcareError } from '@uploadcare/api-client-utils'
import { Headers, ErrorRequestInfo } from '../request/types'

export type ErrorResponseInfo = {
  error?: {
    statusCode: number
    content: string
    errorCode: string
  }
}

export class UploadClientError extends UploadcareError {
  isCancel?: boolean

  readonly code?: string
  readonly request?: ErrorRequestInfo
  readonly response?: ErrorResponseInfo
  readonly headers?: Headers

  constructor(
    message: string,
    code?: string,
    request?: ErrorRequestInfo,
    response?: ErrorResponseInfo,
    headers?: Headers
  ) {
    super()

    this.name = 'UploadClientError'
    this.message = message
    this.code = code
    this.request = request
    this.response = response
    this.headers = headers

    Object.setPrototypeOf(this, UploadClientError.prototype)
  }
}
