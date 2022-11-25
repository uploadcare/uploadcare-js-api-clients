import { expect, jest } from '@jest/globals'
import { Headers, Response } from '../lib/fetch/fetch.node'
import { RestClientError } from './RestClientError'
import { retryIfThrottled } from './retryIfThrottled'

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

const createRequestMock = ({
  throttledAttempts,
  error,
  response = new Response()
}: {
  throttledAttempts: number
  error?: Error
  response?: Response
}) => {
  let runs = 0
  const mock = jest.fn(async () => {
    ++runs

    if (error) {
      throw error
    }

    if (runs <= throttledAttempts) {
      return THROTTLED_RESPONSE
    }

    return response
  })

  return mock
}

describe('retryIfThrottled', () => {
  it("should be rejected with tasks's error", async () => {
    const error = new Error()
    const mock = createRequestMock({ throttledAttempts: 10, error })

    await expect(retryIfThrottled(mock, 5)).rejects.toThrowError(error)
    expect(mock).toHaveBeenCalledTimes(1)
  })

  it('should be rejected with RestClientError if was throttled and limit was left', async () => {
    const mock = createRequestMock({ throttledAttempts: 10 })

    await expect(retryIfThrottled(mock, 5)).rejects.toThrowError(
      RestClientError
    )
    expect(mock).toHaveBeenCalledTimes(6)
  })

  it("should be resolved with task's resolvee if was throttled and limit is not left", async () => {
    const response = new Response()
    const mock = createRequestMock({ throttledAttempts: 3, response })

    await expect(retryIfThrottled(mock, 10)).resolves.toEqual(response)
    expect(mock).toHaveBeenCalledTimes(4)
  })

  it("should be resolved with task's resolvee if was not throttled", async () => {
    const response = new Response()
    const mock = createRequestMock({ throttledAttempts: 0, response })

    await expect(retryIfThrottled(mock, 0)).resolves.toEqual(response)
    expect(mock).toHaveBeenCalledTimes(1)
  })
})
