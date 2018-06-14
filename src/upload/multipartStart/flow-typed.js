/* @flow */

export type Options = {
  contentType?: string,
  expire?: number,
  filename: string,
  partSize?: number,
  publicKey: string,
  signature?: string,
  size: number,
  source?: string,
  store?: boolean | 'auto',
}

export type MultipartStartResponse = {
  parts: Array<string>,
  uuid: string
}
