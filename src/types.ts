export interface Settings {
  baseCDN?: string
  baseURL?: string
  publicKey?: string
  fileName?: string
  store?: boolean
  secureSignature?: string
  secureExpire?: string
  integration?: string
  checkForUrlDuplicates?: boolean
  saveUrlForRecurrentUploads?: boolean
  source?: string
  jsonpCallback?: string
  pollingTimeoutMilliseconds?: number
  maxContentLength?: number
  retryThrottledRequestMaxTimes?: number
  multipartChunkSize?: number
  multipartMinFileSize?: number
  multipartMinLastPartSize?: number
  maxConcurrentRequests?: number
  contentType?: string
}

export interface DefaultSettings extends Settings {
  baseCDN: string
  baseURL: string
  fileName: string
  maxContentLength: number
  retryThrottledRequestMaxTimes: number
  multipartMinFileSize: number
  multipartChunkSize: number
  multipartMinLastPartSize: number
  maxConcurrentRequests: number
  pollingTimeoutMilliseconds: number
  contentType: string
}
