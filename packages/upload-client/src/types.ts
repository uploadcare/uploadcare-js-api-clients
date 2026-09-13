import { CustomUserAgent, StoreValue } from '@uploadcare/api-client-utils'

/**
 * JWT for the Upload API `Authorization: Bearer <token>` scheme. Accepts a
 * plain token or a resolver function; the resolver is called before every
 * request, so long-running uploads (e.g. multipart) can supply a fresh token
 * mid-flight. Token issuing and refreshing are the caller's responsibility.
 *
 * Takes precedence over legacy `secureSignature` / `secureExpire`: when both
 * are provided, only the Authorization header is sent.
 */
export type AuthToken = string | (() => string | Promise<string>)

export interface DefaultSettings {
  baseCDN: string
  /**
   * Base domain used to build per-project prefixed CDN URLs (default
   * `https://ucarecd.net`).
   */
  prefixedBaseCDN: string
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
  authToken?: AuthToken
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
