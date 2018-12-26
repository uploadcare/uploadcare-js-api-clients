/* @flow */
import type {ErrorRequestInfo, ErrorResponseInfo} from './types'

export default class RequestError extends Error {
  request: ErrorRequestInfo
  response: ErrorResponseInfo

  constructor(request: ErrorRequestInfo, response: ErrorResponseInfo) {
    super()

    this.name = 'RequestError'
    this.message = `[${response.status}] ${response.statusText}`
    this.request = request
    this.response = response

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
