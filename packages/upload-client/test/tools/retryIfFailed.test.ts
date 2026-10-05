import { expect, jest } from '@jest/globals'
import { NetworkError } from '@uploadcare/api-client-utils'
import { retryIfFailed } from '../../src/tools/retryIfFailed'
import { UploadError } from '../../src/tools/UploadError'
import type { ServerErrorCode } from '../../src/tools/ServerErrorCode'

const options = {
  retryThrottledRequestMaxTimes: 0,
  retryNetworkErrorMaxTimes: 0
}

const failWith = (code: ServerErrorCode) =>
  new UploadError('refused', code, undefined, {
    error: { statusCode: 401, content: 'refused', errorCode: code }
  })

/** Fails the first call with `code`, succeeds on every call after it. */
const failingOnce = (code: ServerErrorCode) => {
  let calls = 0
  return jest.fn(async () => {
    calls += 1
    if (calls === 1) throw failWith(code)
    return 'uploaded'
  })
}

describe('retryIfFailed, auth failures', () => {
  it.each([['AccessTokenExpiredError'], ['OperationsLimitExceededError']] as [
    ServerErrorCode
  ][])(
    'should retry %s once with a provider, dropping the refused token first',
    async (code) => {
      const invalidate = jest.fn()
      const fn = failingOnce(code)

      await expect(
        retryIfFailed(fn, {
          ...options,
          authToken: { getToken: () => 'token', invalidate }
        })
      ).resolves.toBe('uploaded')

      expect(fn).toHaveBeenCalledTimes(2)
      // Without this the cache hands back the token the server just refused.
      expect(invalidate).toHaveBeenCalledTimes(1)
    }
  )

  it('should retry a plain resolver, which has nothing to invalidate', async () => {
    const fn = failingOnce('OperationsLimitExceededError')

    await expect(
      retryIfFailed(fn, { ...options, authToken: () => 'token' })
    ).resolves.toBe('uploaded')

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should not retry a plain token, which cannot change', async () => {
    const fn = failingOnce('OperationsLimitExceededError')

    await expect(
      retryIfFailed(fn, { ...options, authToken: 'static.jwt.token' })
    ).rejects.toThrow(UploadError)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should give up after one retry, however many times the token is refused', async () => {
    const invalidate = jest.fn()
    const fn = jest.fn(async () => {
      throw failWith('OperationsLimitExceededError')
    })

    await expect(
      retryIfFailed(fn, {
        ...options,
        authToken: { getToken: () => 'token', invalidate }
      })
    ).rejects.toThrow(UploadError)

    expect(fn).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledTimes(1)
  })

  it('should spend one budget across both codes, not one each', async () => {
    const invalidate = jest.fn()
    const codes: ServerErrorCode[] = [
      'AccessTokenExpiredError',
      'OperationsLimitExceededError'
    ]
    const fn = jest.fn(async () => {
      const code = codes.shift()
      if (code) throw failWith(code)
      return 'uploaded'
    })

    await expect(
      retryIfFailed(fn, {
        ...options,
        authToken: { getToken: () => 'token', invalidate }
      })
    ).rejects.toThrow(UploadError)

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should not retry a scope refusal, which a new token would repeat', async () => {
    const invalidate = jest.fn()
    const fn = failingOnce('ScopeForbiddenError')

    await expect(
      retryIfFailed(fn, {
        ...options,
        authToken: { getToken: () => 'token', invalidate }
      })
    ).rejects.toThrow(UploadError)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('should not invalidate for a failure unrelated to the token', async () => {
    const invalidate = jest.fn()
    const fn = jest.fn(async () => {
      throw new NetworkError({} as never)
    })

    await expect(
      retryIfFailed(fn, {
        ...options,
        authToken: { getToken: () => 'token', invalidate }
      })
    ).rejects.toThrow(NetworkError)

    expect(invalidate).not.toHaveBeenCalled()
  })
})
