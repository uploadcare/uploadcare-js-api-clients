import dataUriToBuffer from 'data-uri-to-buffer'
import dataUriToBlob from 'dataurl-to-blob'
import defaultSettings from '../src/defaultSettings'
import { DefaultSettings } from '../src/types'

export const dataURItoBuffer: (uri: string) => Buffer = dataUriToBuffer as (
  uri: string
) => Buffer
export const dataURItoBlob: (uri: string) => Blob = dataUriToBlob

export enum Environment {
  Development = 'development',
  Production = 'production'
}

export const getSettingsForTesting = <T>(options: T): T & DefaultSettings => {
  const selectedEnvironment = process.env.TEST_ENV || Environment.Development

  const allEnvironments = {
    development: {
      ...defaultSettings,
      baseCDN: 'http://localhost:3000',
      baseURL: 'http://localhost:3000',
      multipartMinFileSize: 10 * 1024 * 1024,
      ...options
    },
    production: {
      ...defaultSettings,
      baseCDN: 'https://ucarecdn.com',
      baseURL: 'https://upload.uploadcare.com',
      multipartMinFileSize: 10 * 1024 * 1024,
      ...options
    }
  }

  return allEnvironments[selectedEnvironment]
}

export function assertProgressMock(onProgress: jest.Mock): void {
  expect(onProgress).toHaveBeenCalled()
  expect(onProgress).toHaveBeenLastCalledWith({ value: 1 })

  let lastProgressValue = -1
  for (const [progress] of onProgress.mock.calls) {
    const { value } = progress
    expect(typeof value === 'number').toBeTruthy()
    expect(value).toBeGreaterThanOrEqual(lastProgressValue)
    lastProgressValue = value
  }
}
