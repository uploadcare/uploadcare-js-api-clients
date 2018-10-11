/* @flow */
import type {Token} from '../fromUrlStatus/flow-typed'

export type Options = {
  publicKey: string,
  store?: boolean | 'auto',
  fileName?: string,
}

export type FromUrlResponse = {
  token: Token
}
