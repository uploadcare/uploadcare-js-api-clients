import { UploadClientError } from './errors'
import { retrier, UploadcareNetworkError } from '@uploadcare/api-client-utils'

const REQUEST_WAS_THROTTLED_CODE = 'RequestThrottledError'
const DEFAULT_THROTTLED_TIMEOUT = 15000
const DEFAULT_NETWORK_ERROR_TIMEOUT = 1000

function getTimeoutFromThrottledRequest(error: UploadClientError): number {
  const { headers } = error || {}

  return (
    (headers &&
      Number.parseInt(headers['x-throttle-wait-seconds'] as string) * 1000) ||
    DEFAULT_THROTTLED_TIMEOUT
  )
}

type RetryIfFailedOptions = {
  retryThrottledRequestMaxTimes: number
  retryNetworkErrorMaxTimes: number
}

export function retryIfFailed<T>(
  fn: () => Promise<T>,
  options: RetryIfFailedOptions
): Promise<T> {
  const { retryThrottledRequestMaxTimes, retryNetworkErrorMaxTimes } = options
  return retrier(({ attempt, retry }) =>
    fn().catch((error: Error | UploadClientError | UploadcareNetworkError) => {
      if (
        'response' in error &&
        error?.code === REQUEST_WAS_THROTTLED_CODE &&
        attempt < retryThrottledRequestMaxTimes
      ) {
        return retry(getTimeoutFromThrottledRequest(error))
      }

      if (
        error instanceof UploadcareNetworkError &&
        attempt < retryNetworkErrorMaxTimes
      ) {
        return retry((attempt + 1) * DEFAULT_NETWORK_ERROR_TIMEOUT)
      }

      throw error
    })
  )
}
