import { Headers, ErrorRequestInfo } from '../request/types'
import type { ServerErrorCode } from './ServerErrorCode'
import { UploadError, ErrorResponseInfo } from './UploadError'

/**
 * `satisfies` rather than a bare `as const`: these are the strings the Upload
 * API actually sends, so a typo or a renamed server code fails to compile here
 * instead of silently never matching a response.
 */
export const AUTH_ERROR_CODES = [
  'AccessTokenExpiredError',
  'OperationsLimitExceededError',
  'ScopeForbiddenError',
  'AccessTokenInvalidError'
] as const satisfies readonly ServerErrorCode[]

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number]

export const isAuthErrorCode = (
  code?: ServerErrorCode
): code is AuthErrorCode =>
  !!code && (AUTH_ERROR_CODES as readonly string[]).includes(code)

/**
 * A JWT (Bearer token) auth failure reported by the Upload API. `code` always
 * holds the raw server error code: `AccessTokenExpiredError` is the only one
 * worth refreshing the token and retrying for; the rest are final.
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
}
