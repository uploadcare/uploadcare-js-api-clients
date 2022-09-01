/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { retryIfFailed } from '../../src/tools/retryIfFailed'
import { UploadClientError } from '../../src/tools/errors'
import { jest, expect } from '@jest/globals'
import { UploadcareNetworkError } from '@uploadcare/api-client-utils'

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
  const spy = jest.fn()

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

const throttledError = new UploadClientError(
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
  { 'x-throttle-wait-seconds': '1' }
)

const networkError = new UploadcareNetworkError(
  new Event('ProgressEvent') as ProgressEvent
)

describe('retryIfFailed', () => {
  describe('Throttle errors', () => {
    it('should work', async () => {
      const { spy, task } = createRunner({ attempts: 1, error: throttledError })

      await expect(
        retryIfFailed<number>(task, {
          retryThrottledRequestMaxTimes: 10,
          retryNetworkErrorMaxTimes: 0
        })
      ).resolves.toBe(0)
      expect(spy).toHaveBeenCalledTimes(2)
    })

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

    it('should be rejected with UploadClientError if MaxTimes = 0', async () => {
      const { spy, task } = createRunner({ error: throttledError })

      await expect(
        retryIfFailed<number>(task, {
          retryThrottledRequestMaxTimes: 0,
          retryNetworkErrorMaxTimes: 0
        })
      ).rejects.toThrowError(UploadClientError)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should resolve if task resolve', async () => {
      const { spy, task } = createRunner({
        error: throttledError,
        attempts: 3,
        resolve: 100
      })

      await expect(
        retryIfFailed<number>(task, {
          retryThrottledRequestMaxTimes: 10,
          retryNetworkErrorMaxTimes: 0
        })
      ).resolves.toBe(100)
      expect(spy).toHaveBeenCalledTimes(4)
    })

    it('should resolve without errors if task resolve', async () => {
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
    it('should work', async () => {
      const { spy, task } = createRunner({ attempts: 1, error: networkError })

      await expect(
        retryIfFailed<number>(task, {
          retryNetworkErrorMaxTimes: 10,
          retryThrottledRequestMaxTimes: 0
        })
      ).resolves.toBe(0)
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

    it('should be rejected with UploadcareNetworkError if MaxTimes = 0', async () => {
      const { spy, task } = createRunner({ error: networkError })

      await expect(
        retryIfFailed<number>(task, {
          retryNetworkErrorMaxTimes: 0,
          retryThrottledRequestMaxTimes: 0
        })
      ).rejects.toThrowError(UploadcareNetworkError)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should resolve if task resolve', async () => {
      const { spy, task } = createRunner({
        error: networkError,
        attempts: 3,
        resolve: 100
      })

      await expect(
        retryIfFailed<number>(task, {
          retryNetworkErrorMaxTimes: 10,
          retryThrottledRequestMaxTimes: 0
        })
      ).resolves.toBe(100)
      expect(spy).toHaveBeenCalledTimes(4)
    })

    it('should resolve without errors if task resolve', async () => {
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
      const { task } = createRunner({ error: networkError, attempts: 4 })

      const start = Date.now()
      await expect(
        retryIfFailed<number>(task, {
          retryNetworkErrorMaxTimes: 10,
          retryThrottledRequestMaxTimes: 0
        })
      ).resolves.toBe(0)
      const end = Date.now()
      const diff = end - start

      // 1+2+3+4=10
      expect(diff).toBeGreaterThan(10000)
      // expect max ~4s spent on doing requests, it could be slow on CI and needs to be tested
      expect(diff).toBeLessThan(14000)
    })
  })
})
