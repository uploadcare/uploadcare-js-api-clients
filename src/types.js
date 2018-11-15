/* @flow */
export type UploadcareSettings = {
  baseURL?: string,
  publicKey?: string | null,
  doNotStore?: boolean,
  secureSignature?: string,
  secureExpire?: string,
  integration?: string,
  userAgent?: string,
  debug?: boolean,
}
