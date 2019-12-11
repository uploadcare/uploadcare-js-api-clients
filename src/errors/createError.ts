import {enhanceError} from './enhanceError'
import {ErrorRequestInfo, ErrorResponseInfo, UploadcareError} from './types'

export const createError = (
  name: string,
  message: string,
  code?: number,
  request?: ErrorRequestInfo,
  response?: ErrorResponseInfo,
): UploadcareError => {
  const error = new Error(message)

  return enhanceError(error, name, code, request, response)
}
