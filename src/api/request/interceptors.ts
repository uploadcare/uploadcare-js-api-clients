import {AxiosInstance} from 'axios'

interface InterceptorConcurrencyParams {
  instance: AxiosInstance;
  maxConcurrentRequestsCount: number;
  intervalToCheckPendingRequestsMs?: number;
}

/**
 * This interceptor adds concurrency for requests.
 *
 * @param {AxiosInstance} instance - Axios instance.
 * @param {number} maxConcurrentRequestsCount - Max count of concurrent requests.
 * @param {number} intervalToCheckPendingRequestsMs - Interval to check pending requests.
 */
export const addMaxConcurrencyInterceptorsToAxiosInstance = ({
  instance,
  maxConcurrentRequestsCount,
  intervalToCheckPendingRequestsMs = 10,
}: InterceptorConcurrencyParams): void => {
  let pendingRequestsCount = 0

  instance.interceptors.request.use((config) => {
    return new Promise((resolve): void => {
      const interval = setInterval(() => {
        if (pendingRequestsCount < maxConcurrentRequestsCount) {
          pendingRequestsCount++
          clearInterval(interval)
          resolve(config)
        }
      }, intervalToCheckPendingRequestsMs)
    })
  })

  instance.interceptors.response.use((response) => {
    pendingRequestsCount = Math.max(0, pendingRequestsCount - 1)
    return Promise.resolve(response)
  }, (error) => {
    pendingRequestsCount = Math.max(0, pendingRequestsCount - 1)
    return Promise.reject(error)
  })
}
