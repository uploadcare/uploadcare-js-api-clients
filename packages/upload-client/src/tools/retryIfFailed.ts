import type { ServerErrorCode } from './ServerErrorCode'
import { isAuthTokenResolver } from './resolveAuthToken'
import { UploadError } from './UploadError'
import type { AuthToken } from '../types'
import { retrier, NetworkError } from '@uploadcare/api-client-utils'

// `satisfies` so a renamed or mistyped server code fails to compile rather
// than quietly never matching a response.
const REQUEST_WAS_THROTTLED_CODE =
  'RequestThrottledError' satisfies ServerErrorCode
const TOKEN_EXPIRED_CODE = 'AccessTokenExpiredError' satisfies ServerErrorCode
const DEFAULT_RETRY_AFTER_TIMEOUT = 15000
const DEFAULT_NETWORK_ERROR_TIMEOUT = 1000
/** One refresh is enough: a second expiry means the new token is bad too. */
const MAX_EXPIRED_TOKEN_RETRIES = 1

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
   * The request's auth token, if it has one. Only a resolver can produce a
   * fresh one, so it is what decides whether an expired token is worth
   * retrying; a plain token would just fail again.
   */
  authToken?: AuthToken
}

export function retryIfFailed<T>(
  fn: () => Promise<T>,
  options: RetryIfFailedOptions
): Promise<T> {
  const {
    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes,
    authToken
  } = options
  const canRetryExpiredToken = isAuthTokenResolver(authToken)
  // Counted separately from `attempt`, which the retrier shares with the
  // throttle and network branches. Keyed off `attempt` instead, a token that
  // expired after a throttle retry would never be refreshed, because `attempt`
  // is already past the budget by the time the expiry is seen.
  let expiredTokenRetries = 0

  return retrier(({ attempt, retry }) =>
    fn().catch((error: Error | UploadError | NetworkError) => {
      if (
        error instanceof UploadError &&
        error.code === REQUEST_WAS_THROTTLED_CODE &&
        attempt < retryThrottledRequestMaxTimes
      ) {
        return retry(getTimeoutFromThrottledRequest(error))
      }

      if (
        error instanceof UploadError &&
        error.code === TOKEN_EXPIRED_CODE &&
        canRetryExpiredToken &&
        expiredTokenRetries < MAX_EXPIRED_TOKEN_RETRIES
      ) {
        expiredTokenRetries += 1
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
