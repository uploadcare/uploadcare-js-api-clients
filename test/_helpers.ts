// TODO: Fix ts-ignore
// @ts-ignore
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

// TODO: Fix ts-ignore
// @ts-ignore
export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
