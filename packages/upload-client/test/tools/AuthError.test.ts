import { expect } from '@jest/globals'
import {
  AUTH_ERROR_CODES,
  AuthError,
  createUploadError,
  isAuthErrorCode
} from '../../src/tools/AuthError'
import { UploadError } from '../../src/tools/UploadError'

describe('AuthError', () => {
  it('should be an UploadError with the raw server code', () => {
    const error = new AuthError('Token has expired.', 'TokenExpiredError')

    expect(error).toBeInstanceOf(AuthError)
    expect(error).toBeInstanceOf(UploadError)
    expect(error.name).toBe('AuthError')
    expect(error.code).toBe('TokenExpiredError')
  })

  describe('fromUploadError', () => {
    it('should copy every field for a JWT auth code', () => {
      const headers = { 'x-request-id': 'test' }
      const source = new UploadError(
        'Token is invalid.',
        'TokenInvalidError',
        undefined,
        undefined,
        headers
      )
      const error = AuthError.fromUploadError(source)

      expect(error).toBeInstanceOf(AuthError)
      expect(error?.message).toBe('Token is invalid.')
      expect(error?.code).toBe('TokenInvalidError')
      expect(error?.headers).toBe(headers)
    })

    it('should return null for non-auth codes', () => {
      expect(
        AuthError.fromUploadError(
          new UploadError('message', 'RequestThrottledError')
        )
      ).toBe(null)
      expect(AuthError.fromUploadError(new UploadError('message'))).toBe(null)
    })
  })
})

describe('isAuthErrorCode', () => {
  it('should accept exactly the JWT auth codes', () => {
    for (const code of AUTH_ERROR_CODES) {
      expect(isAuthErrorCode(code)).toBe(true)
    }
    expect(isAuthErrorCode('RequestThrottledError')).toBe(false)
    expect(isAuthErrorCode(undefined)).toBe(false)
  })
})

describe('createUploadError', () => {
  it('should create an AuthError for JWT auth codes', () => {
    const error = createUploadError(
      'Operation quota exhausted.',
      'TokenOperationsExhaustedError'
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error.code).toBe('TokenOperationsExhaustedError')
  })

  it('should create a plain UploadError otherwise', () => {
    const error = createUploadError(
      'File is too large.',
      'FileSizeLimitExceededError'
    )

    expect(error).toBeInstanceOf(UploadError)
    expect(error).not.toBeInstanceOf(AuthError)
  })
})
