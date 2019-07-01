import {ErrorRequestInfo, ErrorResponseInfo} from './types'
import UploadcareError from './UploadcareError'

export default class RequestWasThrottledError extends UploadcareError {
  constructor(request: ErrorRequestInfo, response: ErrorResponseInfo, message) {
    super(request, response)
    this.name = 'RequestWasThrottledError'
    this.message = message
  }
}
