/* @flow */
import {version} from '../package.json'
import type {Settings} from './types'

export type DefaultSettings = {
  baseURL: string,
}

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
const defaultSettings: DefaultSettings = {baseURL: 'https://upload.uploadcare.com'}

export default defaultSettings

/**
 * Returns User Agent based on version and settings
 *
 * @param {Settings} [settings]
 * @returns {string}
 */
export function getUserAgent(settings: Settings = {}): string {
  const publicKey = settings.publicKey ? '/' + settings.publicKey : ''
  const integration = settings.integration ? '; ' + settings.integration : ''

  return `UploadcareUploadClient/${version}${publicKey} (JavaScript${integration})`
}
