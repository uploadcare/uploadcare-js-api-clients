/* @flow */
import dataUriToBuffer from 'data-uri-to-buffer'
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
