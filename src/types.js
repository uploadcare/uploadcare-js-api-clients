/* @flow */
export type Settings = {
  baseURL?: string,
  publicKey?: string | null,
  doNotStore?: boolean,
  secureSignature?: string,
  secureExpire?: string,
  integration?: string,
  userAgent?: string,
  debug?: boolean,
}

export type FileData = Blob | File | Buffer
