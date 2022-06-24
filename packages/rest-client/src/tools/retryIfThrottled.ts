import { retrier } from '@uploadcare/api-client-utils'
import { RestClientError } from './RestClientError'

const THROTTLED_STATUS = 429
const DEFAULT_RETRY_AFTER_TIMEOUT = 10

function getTimeoutFromThrottledRequest(response: Response): number {
  const { headers } = response
  const retryAfterValue = headers.get('retry-after')
  const retryAfterSeconds = retryAfterValue
    ? parseInt(retryAfterValue, 10)
    : DEFAULT_RETRY_AFTER_TIMEOUT

  return retryAfterSeconds * 1000
}

export function retryIfThrottled(
  fn: () => Promise<Response>,
  retryThrottledMaxTimes: number
): Promise<Response> {
  return retrier(({ attempt, retry }) =>
    fn().then(async (response) => {
      if (response.status !== THROTTLED_STATUS) {
        return response
      }
      if (attempt < retryThrottledMaxTimes) {
        return retry(getTimeoutFromThrottledRequest(response))
      }
      const json = await response.json()
      const { detail } = json
      throw new RestClientError(detail, { response })
    })
  )
}
