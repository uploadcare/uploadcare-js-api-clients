import {ErrorRequestInfoInterface, ErrorResponseInfoInterface} from './types'
import RequestError from './RequestError'

export default class UploadcareError extends Error {
  readonly request: ErrorRequestInfoInterface
  readonly response: ErrorResponseInfoInterface

  constructor(requestError: RequestError) {
    super()

    this.name = 'UploadcareError'
    this.message = `[${requestError.response.status}] ${requestError.response.statusText}`
    this.request = requestError.request
    this.response = requestError.response

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UploadcareError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
