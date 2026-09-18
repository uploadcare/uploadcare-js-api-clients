import { UploadError } from './UploadError'
import { retrier, NetworkError } from '@uploadcare/api-client-utils'

const REQUEST_WAS_THROTTLED_CODE = 'RequestThrottledError'
const TOKEN_EXPIRED_CODE = 'TokenExpiredError'
const DEFAULT_RETRY_AFTER_TIMEOUT = 15000
const DEFAULT_NETWORK_ERROR_TIMEOUT = 1000

function getTimeoutFromThrottledRequest(error: UploadError): number {
  const { headers } = error || {}
  if (!headers || typeof headers['retry-after'] !== 'string') {
    return DEFAULT_RETRY_AFTER_TIMEOUT
  }
  const seconds = parseInt(headers['retry-after'], 10)
  if (!Number.isFinite(seconds)) {
    return DEFAULT_RETRY_AFTER_TIMEOUT
  }
  return seconds * 1000
}

type RetryIfFailedOptions = {
  retryThrottledRequestMaxTimes: number
  retryNetworkErrorMaxTimes: number
  /**
   * Retry once on `TokenExpiredError`. Only makes sense when `fn` re-resolves
   * the auth token on each attempt (i.e. `authToken` is a resolver function); a
   * plain token would just fail again.
   */
  canRetryExpiredToken?: boolean
}

export function retryIfFailed<T>(
  fn: () => Promise<T>,
  options: RetryIfFailedOptions
): Promise<T> {
  const {
    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes,
    canRetryExpiredToken
  } = options
  return retrier(({ attempt, retry }) =>
    fn().catch((error: Error | UploadError | NetworkError) => {
      if (
        'response' in error &&
        error?.code === REQUEST_WAS_THROTTLED_CODE &&
        attempt < retryThrottledRequestMaxTimes
      ) {
        return retry(getTimeoutFromThrottledRequest(error))
      }

      if (
        'response' in error &&
        error?.code === TOKEN_EXPIRED_CODE &&
        canRetryExpiredToken &&
        attempt < 1
      ) {
        return retry(0)
      }

      if (
        error instanceof NetworkError &&
        attempt < retryNetworkErrorMaxTimes
      ) {
        return retry((attempt + 1) * DEFAULT_NETWORK_ERROR_TIMEOUT)
      }

      throw error
    })
  )
}
