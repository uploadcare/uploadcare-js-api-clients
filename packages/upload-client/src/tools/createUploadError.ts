import { Headers, ErrorRequestInfo } from '../request/types'
import { AuthError, isAuthErrorCode } from './AuthError'
import type { ServerErrorCode } from './ServerErrorCode'
import { UploadError, ErrorResponseInfo } from './UploadError'

/**
 * Builds the error for a failed Upload API response: an `AuthError` when the
 * server error code is a JWT auth code, a plain `UploadError` otherwise.
 *
 * Every API method throws through this, so a caller can narrow with `instanceof
 * AuthError` wherever the client reports a failure.
 */
export const createUploadError = (
  message: string,
  code?: ServerErrorCode,
  request?: ErrorRequestInfo,
  response?: ErrorResponseInfo,
  headers?: Headers
): UploadError =>
  isAuthErrorCode(code)
    ? new AuthError(message, code, request, response, headers)
    : new UploadError(message, code, request, response, headers)
