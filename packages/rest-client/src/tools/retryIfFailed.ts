import { retrier } from '@uploadcare/api-client-utils'
import { RestClientError } from './RestClientError'

const THROTTLED_STATUS = 429
const DEFAULT_RETRY_AFTER_TIMEOUT = 15000
const DEFAULT_NETWORK_ERROR_TIMEOUT = 1000

function getTimeoutFromThrottledRequest(response: Response): number {
  const { headers } = response
  if (!headers || !headers.get('retry-after')) {
    return DEFAULT_RETRY_AFTER_TIMEOUT
  }
  const seconds = parseInt(headers.get('retry-after') as string, 10)
  if (!Number.isFinite(seconds)) {
    return DEFAULT_RETRY_AFTER_TIMEOUT
  }
  return seconds * 1000
}

export function retryIfFailed(
  fn: () => Promise<Response>,
  options: {
    retryThrottledRequestMaxTimes: number
    retryNetworkErrorMaxTimes: number
  }
): Promise<Response> {
  return retrier(({ attempt, retry }) =>
    fn()
      .then(async (response) => {
        if (response.status !== THROTTLED_STATUS) {
          return response
        }
        if (attempt < options.retryThrottledRequestMaxTimes) {
          return retry(getTimeoutFromThrottledRequest(response))
        }
        const json = await response.json()
        const { detail } = json
        throw new RestClientError(detail, { response })
      })
      .catch((error) => {
        if (attempt < options.retryNetworkErrorMaxTimes) {
          return retry((attempt + 1) * DEFAULT_NETWORK_ERROR_TIMEOUT)
        }

        throw error
      })
  )
}
