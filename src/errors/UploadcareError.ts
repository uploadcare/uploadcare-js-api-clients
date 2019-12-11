import {ErrorRequestInfo, ErrorResponseInfo} from './types'
import RequestError from './RequestError'

export default class UploadcareError extends Error {
  readonly request: ErrorRequestInfo
  readonly response: ErrorResponseInfo

  constructor(requestError: RequestError) {
    super()

    this.name = 'UploadcareError'
    this.message = `[${requestError.response.status}] ${requestError.response.statusText}`
    this.request = requestError.request
    this.response = requestError.response

    Object.setPrototypeOf(this, UploadcareError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UploadcareError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
