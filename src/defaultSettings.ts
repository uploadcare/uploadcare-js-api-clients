import { DefaultSettingsInterface } from './types'

/*
  SettingsInterface for future support:
  multipartMaxAttempts: 3,
  parallelDirectUploads: 10,
  pusherKey: '79ae88bd931ea68464d9',
 */
const defaultSettings: DefaultSettingsInterface = {
  baseCDN: 'https://ucarecdn.com',
  baseURL: 'https://upload.uploadcare.com',
  fileName: 'original',
  maxContentLength: 50 * 1024 * 1024, // 50 MB
  retryThrottledRequestMaxTimes: 1,
  multipartMinFileSize: 25 * 1024 * 1024, // 25 MB
  multipartChunkSize: 5 * 1024 * 1024, // 5 MB
  multipartMinLastPartSize: 1024 * 1024, // 1MB
  maxConcurrentRequests: 4,
  pollingTimeoutMilliseconds: 10000,
  contentType: 'application/octet-stream' // ??
}

export default defaultSettings
