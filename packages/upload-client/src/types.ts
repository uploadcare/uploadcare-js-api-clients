import { CustomUserAgent } from '@uploadcare/api-client-utils'

export interface DefaultSettings {
  baseCDN: string
  baseURL: string
  maxContentLength: number
  retryThrottledRequestMaxTimes: number
  retryNetworkErrorMaxTimes: number
  multipartMinFileSize: number
  multipartChunkSize: number
  multipartMinLastPartSize: number
  maxConcurrentRequests: number
  multipartMaxAttempts: number
  pollingTimeoutMilliseconds: number
  pusherKey: string
}

export interface Settings extends Partial<DefaultSettings> {
  publicKey: string
  fileName?: string
  contentType?: string
  store?: boolean
  secureSignature?: string
  secureExpire?: string
  integration?: string
  userAgent?: CustomUserAgent
  checkForUrlDuplicates?: boolean
  saveUrlForRecurrentUploads?: boolean
  source?: string
  jsonpCallback?: string
}
