import {version} from '../package.json'
import {DefaultSettings, Settings} from './types'

/*
  Settings for future support:
  multipartConcurrency: 4,
  multipartMaxAttempts: 3,
  parallelDirectUploads: 10,
  pusherKey: '79ae88bd931ea68464d9',
 */
const defaultSettings: DefaultSettings = {
  baseCDN: 'https://ucarecdn.com',
  baseURL: 'https://upload.uploadcare.com',
  fileName: 'original',
  retryThrottledRequestMaxTimes: 1,
  multipartMinFileSize: 25 * 1024 * 1024, // 25 MB
  multipartChunkSize: 5 * 1024 * 1024, // 5 MB
  multipartMinLastPartSize: 1024 * 1024, // 1MB
}

export default defaultSettings

/**
 * Returns User Agent based on version and settings.
 *
 * @param {Settings} [settings]
 * @returns {string}
 */
export function getUserAgent(settings: Settings = {}): string {
  const publicKey = settings.publicKey ? '/' + settings.publicKey : ''
  const integration = settings.integration ? '; ' + settings.integration : ''

  return `UploadcareUploadClient/${version}${publicKey} (JavaScript${integration})`
}
