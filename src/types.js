/* @flow */
export type Settings = {
  baseURL?: string,
  publicKey?: string | null,
  doNotStore?: boolean,
  secureSignature?: string,
  secureExpire?: string,
  integration?: string,
}

export type FileData = Blob | File | Buffer

export type FileInfo = {
  [key: string]: string | number | boolean
}
