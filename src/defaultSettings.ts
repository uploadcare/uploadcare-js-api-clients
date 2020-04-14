import { DefaultSettings } from './types'

/*
  Settings for future support:
  parallelDirectUploads: 10,
 */
const defaultSettings: DefaultSettings = {
  baseCDN: 'https://ucarecdn.com',
  baseURL: 'https://upload.uploadcare.com',
  maxContentLength: 50 * 1024 * 1024, // 50 MB
  retryThrottledRequestMaxTimes: 1,
  multipartMinFileSize: 25 * 1024 * 1024, // 25 MB
  multipartChunkSize: 5 * 1024 * 1024, // 5 MB
  multipartMinLastPartSize: 1024 * 1024, // 1MB
  maxConcurrentRequests: 4,
  multipartMaxAttempts: 3,
  pollingTimeoutMilliseconds: 10000,
  contentType: 'application/octet-stream', // ??
  pusherKey: '79ae88bd931ea68464d9'
}

const defaultFilename = 'original'

export { defaultFilename, defaultSettings }
export default defaultSettings
