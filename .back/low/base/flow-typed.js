/* @flow */
export type Options = {
  publicKey: string,
  store?: boolean | 'auto',
  signature?: string,
  expire?: number,
  filename?: string,
  source?: string,
}

export type BaseResponse = {|
  file: string,
|}
