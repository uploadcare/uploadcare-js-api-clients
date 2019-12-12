import * as FormData from 'form-data'
import { Headers } from '../api/request/requestTypes'

type ErrorRequestInfo = {
  method?: string
  url: string
  query?: string
  data?: FormData // Wrong type
  headers?: Headers
}

type ErrorResponseInfo = {
  statusCode: number
  content: string
}

export class UploadClientError extends Error {
  readonly request?: ErrorRequestInfo
  readonly response?: ErrorResponseInfo
  readonly headers?: Headers

  constructor(
    message: string,
    request?: ErrorRequestInfo,
    response?: ErrorResponseInfo,
    headers?: Headers
  ) {
    super()

    this.name = 'UploadClientError'
    this.message = message
    this.request = request
    this.response = response
    this.headers = headers

    Object.setPrototypeOf(this, UploadClientError.prototype)
  }
}

type CancelError = {
  message: string
  request?: ErrorRequestInfo
  response?: ErrorResponseInfo
  headers?: Headers
  isCancel?: boolean
}

export const cancelError = (message = 'Request canceled'): CancelError => {
  const error: CancelError = new UploadClientError(message) as CancelError

  error.isCancel = true

  return error
}
