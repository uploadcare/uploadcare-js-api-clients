import { CustomUserAgent, StoreValue } from '@uploadcare/api-client-utils'

/** Produces a token. Called before every authenticated request. */
export type AuthTokenResolver = () => string | Promise<string>

/**
 * A resolver that can also be told the token it handed over is no longer good.
 * `AuthTokenCache` from `@uploadcare/signed-uploads/client` is one, so an
 * instance can be passed as `authToken` directly.
 *
 * `invalidate` is what lets this client recover from a token the Upload API
 * refuses: without it, asking a cache for a token again returns the same one it
 * just cached, and the retry fails identically.
 */
export type AuthTokenProvider = {
  getToken: AuthTokenResolver
  /** Drop the cached token, so the next `getToken()` fetches a new one. */
  invalidate?: () => void
}

/**
 * JWT for the Upload API `Authorization: Bearer <token>` scheme. Accepts a
 * plain token, a resolver function, or a provider. A resolver is called before
 * every request, so long-running uploads (e.g. multipart) can supply a fresh
 * token mid-flight.
 *
 * This client never stores a token between calls. Rather than fetching one per
 * request, pass an `AuthTokenCache` from `@uploadcare/signed-uploads/client`,
 * which holds the token and replaces it shortly before it expires:
 *
 * ```ts
 * const tokens = new AuthTokenCache({ fetchToken })
 * uploadFile(file, { publicKey, authToken: tokens })
 * ```
 *
 * Passing `tokens.getToken` still works, and the cache still replaces the token
 * on expiry. What the provider form adds is recovery from a token the server
 * refuses: this client drops the cached one and retries once, which is what
 * saves an upload whose token ran out of operations.
 *
 * Mint tokens on your server with `generateAuthToken` from
 * `@uploadcare/signed-uploads` — it needs the project secret key.
 *
 * Takes precedence over legacy `secureSignature` / `secureExpire`: when both
 * are provided, only the Authorization header is sent.
 */
export type AuthToken = string | AuthTokenResolver | AuthTokenProvider

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
