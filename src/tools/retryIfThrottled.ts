import { UploadClientError } from '../errors/errors'
import { delay } from '../api/request/delay'

const REQUEST_WAS_THROTTLED_CODE = 429
const DEFAULT_RETRY_AFTER_TIMEOUT = 15000

function getTimeoutFromThrottledRequest(error: UploadClientError): number {
  const { headers } = error || {}

  return (
    (headers &&
      Number.parseInt(headers['x-throttle-wait-seconds'] as string) * 1000) ||
    DEFAULT_RETRY_AFTER_TIMEOUT
  )
}

function retryIfThrottled<T>(
  fn: () => Promise<T>,
  retryThrottledMaxTimes: number
): Promise<T> {
  let attempts = 0

  function runAttempt(fn: () => Promise<T>): Promise<T> {
    return fn().catch((error: Error | UploadClientError) => {
      if (
        'response' in error &&
        error.response &&
        error.response.statusCode === REQUEST_WAS_THROTTLED_CODE &&
        attempts < retryThrottledMaxTimes
      ) {
        attempts++
        const timeout = getTimeoutFromThrottledRequest(error)

        return delay(timeout).then(() => runAttempt(fn))
      }

      throw error
    })
  }

  return runAttempt(fn)
}

export default retryIfThrottled
