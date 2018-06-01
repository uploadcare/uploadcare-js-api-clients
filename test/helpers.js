/* @flow */

import dataUriToBuffer from 'data-uri-to-buffer'
import dataUriToBlob from 'dataurl-to-blob'

export const dataURItoBuffer: (uri: string) => Buffer = dataUriToBuffer
export const dataURItoBlob: (uri: string) => Buffer = dataUriToBlob

export function wait(timeout: number): Promise<> {
  return new Promise(res => {
    setTimeout(() => {
      res()
    }, timeout)
  })
}

export function isNode(): boolean {
  return Object.prototype.toString.call(global.process) === '[object process]'
}
