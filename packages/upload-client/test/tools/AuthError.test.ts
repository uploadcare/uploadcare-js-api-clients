import { expect } from '@jest/globals'
import {
  AUTH_ERROR_CODES,
  AuthError,
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
