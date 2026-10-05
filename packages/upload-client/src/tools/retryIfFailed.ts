import type { ServerErrorCode } from './ServerErrorCode'
import { isAuthTokenResolver, normalizeAuthToken } from './resolveAuthToken'
import { UploadError } from './UploadError'
import type { AuthToken } from '../types'
import { retrier, NetworkError } from '@uploadcare/api-client-utils'

// `satisfies` so a renamed or mistyped server code fails to compile rather
// than quietly never matching a response.
const REQUEST_WAS_THROTTLED_CODE =
  'RequestThrottledError' satisfies ServerErrorCode
/**
 * Auth failures a different token can fix. An expired token needs a newer one;
 * a spent operation limit needs a token with its own budget. A scope refusal is
 * not here: a reissued token carries the same scope.
 */
const AUTH_RETRY_CODES: readonly ServerErrorCode[] = [
  'AccessTokenExpiredError',
  'OperationsLimitExceededError'
]
const DEFAULT_RETRY_AFTER_TIMEOUT = 15000
const DEFAULT_NETWORK_ERROR_TIMEOUT = 1000
/** One refresh is enough: a second refusal means the new token is bad too. */
const MAX_AUTH_RETRIES = 1

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
  const resolver = isAuthTokenResolver(authToken)
    ? normalizeAuthToken(authToken)
    : undefined
  // Counted separately from `attempt`, which the retrier shares with the
  // throttle and network branches. Keyed off `attempt` instead, a token
  // refused after a throttle retry would never be replaced, because `attempt`
  // is already past the budget by the time the refusal is seen.
  //
  // One budget for both codes, so a token endpoint handing out bad tokens
  // costs one extra round trip per request rather than one per reason.
  let authRetries = 0

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
        !!error.code &&
        AUTH_RETRY_CODES.includes(error.code) &&
        resolver &&
        authRetries < MAX_AUTH_RETRIES
      ) {
        authRetries += 1
        // Without this a cache hands back the token the server just refused,
        // and the retry fails the same way. A resolver with nothing cached
        // has no `invalidate`, and needs none.
        resolver.invalidate?.()
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
