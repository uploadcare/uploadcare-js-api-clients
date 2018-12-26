/* @flow */
import type {ErrorRequestInfo, ErrorResponseInfo} from './types'

export default class UploadcareError extends Error {
  request: ErrorRequestInfo
  response: ErrorResponseInfo

  constructor(request: ErrorRequestInfo, response: ErrorResponseInfo) {
    super()

    this.name = 'UploadcareError'
    this.message = `Request to ${request.url} failed with Uploadcare error: [${response.status}] ${response.statusText}`
    this.request = request
    this.response = response

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UploadcareError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
