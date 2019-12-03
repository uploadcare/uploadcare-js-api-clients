const dataUriToBuffer = require('data-uri-to-buffer')
import dataUriToBlob from 'dataurl-to-blob'

export const dataURItoBuffer: (uri: string) => Buffer = dataUriToBuffer
export const dataURItoBlob: (uri: string) => Blob = dataUriToBlob

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export enum Environment {
  Development = 'development',
  Production = 'production',
}

export const getSettingsForTesting = (settings = {}, environment: Environment | null = null) => {
  const selectedEnvironment = environment || process.env.NODE_ENV || Environment.Production

  const allEnvironments = {
    development: {
      baseCDN: 'http://localhost:3000',
      baseURL: 'http://localhost:3000',
      multipartMinFileSize: 10 * 1024 * 1024,
      ...settings,
    },
    production: {
      baseCDN: 'https://ucarecdn.com',
      baseURL: 'https://upload.uploadcare.com',
      multipartMinFileSize: 10 * 1024 * 1024,
      ...settings,
    }
  }

  return allEnvironments[selectedEnvironment]
}
