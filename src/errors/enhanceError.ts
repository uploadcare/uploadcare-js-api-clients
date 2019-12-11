import {ErrorRequestInfo, ErrorResponseInfo, UploadcareError} from './types'

export const enhanceError = (
  error: Error,
  name: string,
  code?: number,
  request?: ErrorRequestInfo,
  response?: ErrorResponseInfo,
): UploadcareError => {
  error.name = name

  if (code) {
    Object.defineProperty(error, 'code', code)
  }

  if (request) {
    Object.defineProperty(error, 'request', request)
  }

  if (response) {
    Object.defineProperty(error, 'response', response)
  }

  return error
}
