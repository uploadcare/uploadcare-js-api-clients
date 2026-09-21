import { expect } from '@jest/globals'
import { AuthError } from '../../src/tools/AuthError'
import { createUploadError } from '../../src/tools/createUploadError'
import { UploadError } from '../../src/tools/UploadError'

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

  it('should carry the response details through to an AuthError', () => {
    const headers = { 'x-request-id': 'test' }
    const error = createUploadError(
      'Token is invalid.',
      'TokenInvalidError',
      undefined,
      undefined,
      headers
    )

    expect(error).toBeInstanceOf(AuthError)
    expect(error.message).toBe('Token is invalid.')
    expect(error.headers).toBe(headers)
  })
})
