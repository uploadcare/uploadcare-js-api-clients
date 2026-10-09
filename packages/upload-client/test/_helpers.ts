import { expect } from 'vitest'
import type { Mock } from 'vitest'
import dataUriToBuffer from 'data-uri-to-buffer'
import dataUriToBlob from 'dataurl-to-blob'
import { emulatorOrigin } from './_emulator'
import defaultSettings from '../src/defaultSettings'
import { DefaultSettings } from '../src/types'
import { ProgressCallback, ComputableProgressInfo } from '../src/api/types'

export const dataURItoBuffer: (uri: string) => Buffer = dataUriToBuffer as (
  uri: string
) => Buffer
export const dataURItoBlob: (uri: string) => Blob = dataUriToBlob

export enum Environment {
  Development = 'development',
  Production = 'production'
}

export const getSettingsForTesting = <T>(options: T): T & DefaultSettings => {
  const selectedEnvironment = (process.env.TEST_ENV ||
    Environment.Development) as Environment

  const allEnvironments = {
    development: {
      ...defaultSettings,
      baseCDN: emulatorOrigin,
      baseURL: emulatorOrigin,
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

export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** An uploaded file has a uuid and a `cdnUrl` on the CDN the test set. */
export function assertUploadedFile(
  file: { uuid: string; cdnUrl: string },
  { baseCDN }: { baseCDN: string }
): void {
  expect(file).toMatchObject({
    uuid: expect.stringMatching(UUID),
    cdnUrl: `${baseCDN}/${file.uuid}/`
  })
}

/** A group id: `<uuid>~<number of files>`. */
export const groupIdPattern = (filesCount: number): RegExp =>
  new RegExp(`^${UUID.source.slice(1, -1)}~${filesCount}$`)

/** A created group has a group id and a `cdnUrl` on the CDN the test set. */
export function assertUploadedGroup(
  group: { uuid: string; cdnUrl: string },
  { baseCDN }: { baseCDN: string },
  filesCount: number
): void {
  expect(group).toMatchObject({
    uuid: expect.stringMatching(groupIdPattern(filesCount)),
    cdnUrl: `${baseCDN}/${group.uuid}/`
  })
}

const computable = { isComputable: true, value: expect.any(Number) }

/** Progress values never go backwards. */
const expectNonDecreasing = (values: number[]): void => {
  expect(values).toEqual([...values].sort((a, b) => a - b))
}

export function assertComputableProgress(
  onProgress: Mock<ProgressCallback<ComputableProgressInfo>>
): void {
  expect(onProgress).toHaveBeenLastCalledWith({ isComputable: true, value: 1 })

  const progress = onProgress.mock.calls.map(([info]) => info)
  expect(progress).toEqual(progress.map(() => computable))
  expectNonDecreasing(progress.map(({ value }) => value))
}

/**
 * Computable progress, then unknown progress once the server stops reporting
 * sizes, then a final computable value when the upload finishes.
 */
export function assertUnknownProgress(
  onProgress: Mock<ProgressCallback>
): void {
  const progress = onProgress.mock.calls.map(([info]) => info)
  const firstUnknown = progress.findIndex((info) => !info.isComputable)
  expect(firstUnknown, 'no unknown progress was reported').toBeGreaterThan(-1)

  const known = progress.slice(0, firstUnknown)
  const unknown = progress.slice(firstUnknown, -1)
  expect(known).toEqual(known.map(() => computable))
  expectNonDecreasing(
    known.map((info) => (info as ComputableProgressInfo).value)
  )
  expect(unknown).toEqual(unknown.map(() => ({ isComputable: false })))
  expect(progress.at(-1)).toEqual(computable)
}
