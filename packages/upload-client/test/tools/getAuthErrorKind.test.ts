import { getAuthErrorKind } from '../../src/tools/getAuthErrorKind'
import { UploadError } from '../../src/tools/UploadError'
import { expect } from '@jest/globals'

describe('getAuthErrorKind', () => {
  it.each([
    ['JwtTokenExpiredError', 'token-expired'],
    ['JwtQuotaExceededError', 'quota-exhausted'],
    ['JwtScopeDeniedError', 'scope-denied'],
    ['JwtInvalidError', 'token-invalid']
  ] as const)('should classify %s as %s', (code, kind) => {
    expect(getAuthErrorKind(new UploadError('message', code))).toBe(kind)
  })

  it('should return null for non-auth upload errors', () => {
    expect(
      getAuthErrorKind(new UploadError('message', 'RequestThrottledError'))
    ).toBe(null)
    expect(getAuthErrorKind(new UploadError('message'))).toBe(null)
  })

  it('should return null for non-UploadError values', () => {
    expect(getAuthErrorKind(new Error('boom'))).toBe(null)
    expect(getAuthErrorKind(undefined)).toBe(null)
    expect(getAuthErrorKind('JwtTokenExpiredError')).toBe(null)
  })
})
