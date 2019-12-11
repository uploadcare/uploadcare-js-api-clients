import { version } from "../package.json"
import { DefaultSettingsInterface, SettingsInterface } from "./types"

/*
  SettingsInterface for future support:
  multipartMaxAttempts: 3,
  parallelDirectUploads: 10,
  pusherKey: '79ae88bd931ea68464d9',
 */
const defaultSettings: DefaultSettingsInterface = {
  baseCDN: "https://ucarecdn.com",
  baseURL: "https://upload.uploadcare.com",
  fileName: "original",
  maxContentLength: 50 * 1024 * 1024, // 50 MB
  retryThrottledRequestMaxTimes: 1,
  multipartMinFileSize: 25 * 1024 * 1024, // 25 MB
  multipartChunkSize: 5 * 1024 * 1024, // 5 MB
  multipartMinLastPartSize: 1024 * 1024, // 1MB
  maxConcurrentRequests: 4,
  pollingTimeoutMilliseconds: 10000
}

export default defaultSettings

/**
 * Returns User Agent based on version and settings.
 *
 * @param {SettingsInterface} [settings]
 * @returns {string}
 */
export function getUserAgent(settings: SettingsInterface = {}): string {
  const publicKey = settings.publicKey ? "/" + settings.publicKey : ""
  const integration = settings.integration ? "; " + settings.integration : ""

  return `UploadcareUploadClient/${version}${publicKey} (JavaScript${integration})`
}
