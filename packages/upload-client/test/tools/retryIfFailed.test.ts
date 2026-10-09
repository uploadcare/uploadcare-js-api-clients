import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest'
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
  return vi.fn(async () => {
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
      const invalidate = vi.fn()
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
    const invalidate = vi.fn()
    const fn = vi.fn(async () => {
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
    const invalidate = vi.fn()
    const codes: ServerErrorCode[] = [
      'AccessTokenExpiredError',
      'OperationsLimitExceededError'
    ]
    const fn = vi.fn(async () => {
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
    const invalidate = vi.fn()
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
    const invalidate = vi.fn()
    const fn = vi.fn(async () => {
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

const createRunner = ({
  attempts = 10,
  error,
  resolve = 0
}: {
  attempts?: number
  error: Error
  resolve?: number
}) => {
  let runs = 0
  const spy = vi.fn()

  const task = () =>
    Promise.resolve().then(() => {
      ++runs

      spy()

      if (runs <= attempts) {
        throw error
      }

      return resolve
    })

  return { spy, task }
}

const throttledError = new UploadError(
  'test error',
  'RequestThrottledError',
  undefined,
  {
    error: {
      statusCode: 429,
      content: 'test',
      errorCode: 'RequestThrottledError'
    }
  },
  { 'retry-after': '1' }
)

const networkError = new NetworkError(
  new Event('ProgressEvent') as ProgressEvent
)

describe('retryIfFailed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Throttle errors', () => {
    it('retries a throttled call after retry-after and resolves', async () => {
      const { spy, task } = createRunner({ attempts: 1, error: throttledError })
      const p = retryIfFailed<number>(task, {
        retryThrottledRequestMaxTimes: 10,
        retryNetworkErrorMaxTimes: 0
      })

      // retry-after: 1
      await vi.advanceTimersByTimeAsync(999)
      expect(spy).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      await expect(p).resolves.toBe(0)
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it.each([
      ['without a retry-after', {}],
      ['with a retry-after that is not a number', { 'retry-after': 'soon' }]
    ])(
      'retries a throttled call %s after the 15 s default',
      async (_, headers) => {
        const error = new UploadError(
          'test error',
          'RequestThrottledError',
          undefined,
          undefined,
          headers
        )
        const { spy, task } = createRunner({ attempts: 1, error })
        const p = retryIfFailed<number>(task, {
          retryThrottledRequestMaxTimes: 1,
          retryNetworkErrorMaxTimes: 0
        })

        await vi.advanceTimersByTimeAsync(14999)
        expect(spy).toHaveBeenCalledTimes(1)
        await vi.advanceTimersByTimeAsync(1)
        await expect(p).resolves.toBe(0)
        expect(spy).toHaveBeenCalledTimes(2)
      }
    )

    it('should be rejected with error if not throttled', async () => {
      const error = new Error()
      const { spy, task } = createRunner({ error })

      await expect(
        retryIfFailed<number>(task, {
          retryThrottledRequestMaxTimes: 2,
          retryNetworkErrorMaxTimes: 0
        })
      ).rejects.toThrowError(error)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should be rejected with UploadError if MaxTimes = 0', async () => {
      const { spy, task } = createRunner({ error: throttledError })

      await expect(
        retryIfFailed<number>(task, {
          retryThrottledRequestMaxTimes: 0,
          retryNetworkErrorMaxTimes: 0
        })
      ).rejects.toThrowError(UploadError)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('retries a call throttled three times and resolves with its value', async () => {
      const { spy, task } = createRunner({
        error: throttledError,
        attempts: 3,
        resolve: 100
      })
      const p = retryIfFailed<number>(task, {
        retryThrottledRequestMaxTimes: 10,
        retryNetworkErrorMaxTimes: 0
      })

      // Every throttle waits the same retry-after: 1, unlike network backoff.
      await vi.advanceTimersByTimeAsync(2999)
      expect(spy).toHaveBeenCalledTimes(3)
      await vi.advanceTimersByTimeAsync(1)
      await expect(p).resolves.toBe(100)
      expect(spy).toHaveBeenCalledTimes(4)
    })

    it('runs a call that succeeds at once only once', async () => {
      const { spy, task } = createRunner({ error: throttledError, attempts: 0 })

      await expect(
        retryIfFailed<number>(task, {
          retryThrottledRequestMaxTimes: 10,
          retryNetworkErrorMaxTimes: 0
        })
      ).resolves.toBe(0)
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Network errors', () => {
    it('retries a call that hit a network error and resolves', async () => {
      const { spy, task } = createRunner({ attempts: 1, error: networkError })
      const p = retryIfFailed<number>(task, {
        retryNetworkErrorMaxTimes: 10,
        retryThrottledRequestMaxTimes: 0
      })

      await vi.advanceTimersByTimeAsync(999)
      expect(spy).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)
      await expect(p).resolves.toBe(0)
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('should be rejected with error if no network error', async () => {
      const error = new Error()
      const { spy, task } = createRunner({ error })

      await expect(
        retryIfFailed<number>(task, {
          retryNetworkErrorMaxTimes: 2,
          retryThrottledRequestMaxTimes: 0
        })
      ).rejects.toThrowError(error)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should be rejected with NetworkError if MaxTimes = 0', async () => {
      const { spy, task } = createRunner({ error: networkError })

      await expect(
        retryIfFailed<number>(task, {
          retryNetworkErrorMaxTimes: 0,
          retryThrottledRequestMaxTimes: 0
        })
      ).rejects.toThrowError(NetworkError)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('retries a call that hit three network errors and resolves with its value', async () => {
      const { spy, task } = createRunner({
        error: networkError,
        attempts: 3,
        resolve: 100
      })
      const p = retryIfFailed<number>(task, {
        retryNetworkErrorMaxTimes: 10,
        retryThrottledRequestMaxTimes: 0
      })

      // 1+2+3=6
      await vi.advanceTimersByTimeAsync(5999)
      expect(spy).toHaveBeenCalledTimes(3)
      await vi.advanceTimersByTimeAsync(1)
      await expect(p).resolves.toBe(100)
      expect(spy).toHaveBeenCalledTimes(4)
    })

    it('runs a call that succeeds at once only once', async () => {
      const { spy, task } = createRunner({ error: networkError, attempts: 0 })

      await expect(
        retryIfFailed<number>(task, {
          retryNetworkErrorMaxTimes: 10,
          retryThrottledRequestMaxTimes: 0
        })
      ).resolves.toBe(0)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should increase timeout by 1 second on each attempt', async () => {
      const { spy, task } = createRunner({ error: networkError, attempts: 4 })
      const p = retryIfFailed<number>(task, {
        retryNetworkErrorMaxTimes: 10,
        retryThrottledRequestMaxTimes: 0
      })

      // 1+2+3+4=10
      await vi.advanceTimersByTimeAsync(9999)
      expect(spy).toHaveBeenCalledTimes(4)
      await vi.advanceTimersByTimeAsync(1)
      await expect(p).resolves.toBe(0)
      expect(spy).toHaveBeenCalledTimes(5)
    })
  })
})
