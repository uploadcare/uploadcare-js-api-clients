const dataUriToBuffer = require('data-uri-to-buffer')
import dataUriToBlob from 'dataurl-to-blob'

export const dataURItoBuffer: (uri: string) => Buffer = dataUriToBuffer
export const dataURItoBlob: (uri: string) => Blob = dataUriToBlob

export const isNode = (): boolean => {
  try {
    return Object.prototype.toString.call(global.process) === '[object process]'
  }
  catch (e) {
    return false
  }
}

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export enum Environment {
  Testing = 'testing',
  Staging = 'staging',
  Production = 'production',
}

export const getEnvironmentSettings = (settings = {}, environment: Environment = Environment.Testing) => {
  switch (environment) {
    case Environment.Staging:
      return {
        baseCDN: 'https://ucarecdn.com',
        baseURL: 'https://upload.staging0.uploadcare.com',
        ...settings,
      }
    case Environment.Production:
      return {
        baseCDN: 'https://ucarecdn.com',
        baseURL: 'https://upload.uploadcare.com',
        ...settings,
      }
    default:
      return {
        baseCDN: 'https://ucarecdn.com',
        baseURL: 'https://upload.staging0.uploadcare.com',
        ...settings,
      }
  }
}
