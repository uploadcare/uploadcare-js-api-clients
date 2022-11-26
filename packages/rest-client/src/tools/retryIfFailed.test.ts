import { expect, jest } from '@jest/globals'
import { Headers, Response } from '../lib/fetch/fetch.node'
import { RestClientError } from './RestClientError'
import { retryIfFailed } from './retryIfFailed'

const THROTTLED_RESPONSE = new Response(
  JSON.stringify({
    detail: 'Request was throttled. Expected available in 1 second.'
  }),
  {
    status: 429,
    statusText: 'Too Many Requests',
    headers: new Headers({
      'retry-after': '1'
    })
  }
)

const createRunner = ({
  error,
  attempts,
  response = new Response()
}: {
  attempts: number
  error?: Error
  response?: Response
}) => {
  let runs = 0
  const mock = jest.fn(async () => {
    ++runs

    if (runs <= attempts) {
      if (error) {
        throw error
      }
      return THROTTLED_RESPONSE
    }

    return response
  })

  return mock
}

describe('retryIfFailed', () => {
  it("should be resolved with task's resolvee if was nor throttled nor failed", async () => {
    const response = new Response()
    const mock = createRunner({ attempts: 0, response })

    await expect(
      retryIfFailed(mock, {
        retryThrottledRequestMaxTimes: 5,
        retryNetworkErrorMaxTimes: 5
      })
    ).resolves.toEqual(response)
    expect(mock).toHaveBeenCalledTimes(1)
  })

  describe('throttling', () => {
    it('should be rejected with RestClientError if was throttled and limit was left', async () => {
      const mock = createRunner({ attempts: 10 })

      await expect(
        retryIfFailed(mock, {
          retryThrottledRequestMaxTimes: 5,
          retryNetworkErrorMaxTimes: 0
        })
      ).rejects.toThrowError(RestClientError)
      expect(mock).toHaveBeenCalledTimes(6)
    })

    it("should be resolved with task's resolvee if was throttled and limit was not left", async () => {
      const response = new Response()
      const mock = createRunner({ attempts: 3, response })

      await expect(
        retryIfFailed(mock, {
          retryThrottledRequestMaxTimes: 10,
          retryNetworkErrorMaxTimes: 0
        })
      ).resolves.toEqual(response)
      expect(mock).toHaveBeenCalledTimes(4)
    })
  })

  describe('network errors', () => {
    it("should be rejected with tasks's error if limit was left", async () => {
      const error = new Error()
      const mock = createRunner({ attempts: 5, error })

      await expect(
        retryIfFailed(mock, {
          retryThrottledRequestMaxTimes: 0,
          retryNetworkErrorMaxTimes: 2
        })
      ).rejects.toThrowError(error)
      expect(mock).toHaveBeenCalledTimes(3)
    })

    it("should be resolved with tasks's resolvee if limit was not left", async () => {
      const error = new Error()
      const response = new Response()
      const mock = createRunner({ attempts: 2, error, response })

      await expect(
        retryIfFailed(mock, {
          retryThrottledRequestMaxTimes: 0,
          retryNetworkErrorMaxTimes: 5
        })
      ).resolves.toEqual(response)
      expect(mock).toHaveBeenCalledTimes(3)
    })
  })
})
