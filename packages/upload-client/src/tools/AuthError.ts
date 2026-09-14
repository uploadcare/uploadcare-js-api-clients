import { Headers, ErrorRequestInfo } from '../request/types'
import type { ServerErrorCode } from './ServerErrorCode'
import { UploadError, ErrorResponseInfo } from './UploadError'

export const AUTH_ERROR_CODES = [
  'JwtTokenExpiredError',
  'JwtQuotaExceededError',
  'JwtScopeDeniedError',
  'JwtInvalidError'
] as const

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number]

export const isAuthErrorCode = (
  code?: ServerErrorCode
): code is AuthErrorCode =>
  !!code && (AUTH_ERROR_CODES as readonly string[]).includes(code)

/**
 * A JWT (Bearer token) auth failure reported by the Upload API. `code` always
 * holds the raw server error code: `JwtTokenExpiredError` is the only one worth
 * refreshing the token and retrying for; the rest are final.
 */
export class AuthError extends UploadError {
  declare readonly code: AuthErrorCode

  constructor(
    message: string,
    code: AuthErrorCode,
    request?: ErrorRequestInfo,
    response?: ErrorResponseInfo,
    headers?: Headers
  ) {
    super(message, code, request, response, headers)

    this.name = 'AuthError'

    Object.setPrototypeOf(this, AuthError.prototype)
  }

  static fromUploadError(error: UploadError): AuthError | null {
    if (!isAuthErrorCode(error.code)) {
      return null
    }
    return new AuthError(
      error.message,
      error.code,
      error.request,
      error.response,
      error.headers
    )
  }
}

/**
 * Builds the error for a failed Upload API response: an `AuthError` when the
 * server error code is a JWT auth code, a plain `UploadError` otherwise.
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
