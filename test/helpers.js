/* @flow */

import dataUriToBuffer from 'data-uri-to-buffer'
import dataUriToBlob from 'dataurl-to-blob'
import type {FixtureFile} from './fixtureFactory'
import type {ProgressListener} from '../src/flow-typed'

export const dataURItoBuffer: (uri: string) => Buffer = dataUriToBuffer
export const dataURItoBlob: (uri: string) => Buffer = dataUriToBlob

export function wait(timeout: number): Promise<void> {
  return new Promise(res => {
    setTimeout(() => {
      res()
    }, timeout)
  })
}

export function isNode(): boolean {
  return Object.prototype.toString.call(global.process) === '[object process]'
}

export async function testProgressCallback(
  promise: Promise<any>,
  progress: ProgressListener => void,
  file: FixtureFile,
): Promise<void> {
  expect.assertions(3)

  const onProgress = jest.fn()

  progress(onProgress)

  await promise

  expect(onProgress).toHaveBeenCalled()

  const lastProgressArg =
    onProgress.mock.calls[onProgress.mock.calls.length - 1][0]

  expect(lastProgressArg.total).toBeGreaterThan(file.size)
  expect(lastProgressArg.loaded).toBe(lastProgressArg.total)

}
