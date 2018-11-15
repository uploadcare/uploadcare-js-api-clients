/* @flow */
import type {UploadcareSettings} from './types'

/*
Settings for future support:

  baseCDN: 'https://ucarecdn.com',
  multipartMinSize: 25 * 1024 * 1024,
  multipartPartSize: 5 * 1024 * 1024,
  multipartMinLastPartSize: 1024 * 1024,
  multipartConcurrency: 4,
  multipartMaxAttempts: 3,
  parallelDirectUploads: 10,
  pusherKey: '79ae88bd931ea68464d9',
 */
const defaultSettings: UploadcareSettings = {
  baseURL: 'https://upload.uploadcare.com',
  publicKey: null,
  doNotStore: false,
  secureSignature: '',
  secureExpire: '',
  integration: '',
  userAgent: 'UploadcareUpload (JavaScript)',
  debug: false,
}

export default defaultSettings
