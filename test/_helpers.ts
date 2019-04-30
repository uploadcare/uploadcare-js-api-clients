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

/**
 * Get testing environment both (for Node and Browser).
 */
const getTestingEnvironment = (): string => {
  // @ts-ignore
  return process.argv.find(element => element.startsWith('--env=')).substring(6)
}

export const getSettingsForTesting = (settings = {}, environment: Environment | null = null) => {
  const env = environment || getTestingEnvironment()

  switch (env) {
    case Environment.Testing:
      // TODO: Need to replace when we will have a mock server
      return {
        baseCDN: 'http://localhost:3000',
        baseURL: 'http://localhost:3000',
        ...settings,
      }
    case Environment.Staging:
      return {
        baseCDN: 'https://staging0.ucarecdn.com',
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
        baseCDN: 'http://localhost:3000',
        baseURL: 'http://localhost:3000',
        ...settings,
      }
  }
}
