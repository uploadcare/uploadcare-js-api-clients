/* @flow */

export type Options = {
  publicKey: string,
  store?: boolean | 'auto',
  filename?: string,
  contentType?: string,
  signature?: string,
  expire?: number,
  source?: string,
}
