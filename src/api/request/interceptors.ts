import {AxiosInstance} from 'axios'

export const addMaxConcurrencyInterceptorsToAxiosInstance = ({
  instance,
  maxConcurrentRequestsCount,
  intervalToCheckPendingRequestsMs = 10,
}: {
  instance: AxiosInstance;
  maxConcurrentRequestsCount: number;
  intervalToCheckPendingRequestsMs?: number;
}): void => {
  let pendingRequestsCount = 0

  instance.interceptors.request.use((config) => {
    return new Promise((resolve) => {
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
