/* @flow */
export type Options = {
  publicKey: string,
  store?: boolean | 'auto',
  fileName?: string,
}

export type FromUrlResponse = {
  token: string
}
