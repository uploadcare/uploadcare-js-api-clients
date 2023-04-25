import { CustomUserAgent, StoreValue } from '@uploadcare/api-client-utils'

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
  pollingTimeoutMilliseconds: number
  pusherKey: string
}

export interface Settings extends Partial<DefaultSettings> {
  publicKey: string
  fileName?: string
  contentType?: string
  store?: StoreValue
  secureSignature?: string
  secureExpire?: string
  integration?: string
  userAgent?: CustomUserAgent
  checkForUrlDuplicates?: boolean
  saveUrlForRecurrentUploads?: boolean
  source?: string
  jsonpCallback?: string
}

export type BrowserFile = Blob | File
export type NodeFile = Buffer
export type ReactNativeAsset = {
  type: string
  uri: string
  name?: string
}

export type SupportedFileInput = BrowserFile | NodeFile | ReactNativeAsset
export type Sliceable = BrowserFile | NodeFile
