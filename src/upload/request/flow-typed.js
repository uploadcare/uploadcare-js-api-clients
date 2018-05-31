/* @flow */
import type {Headers, FileData} from '../types'

export type Query = {
  [key: string]: string | boolean | number | typeof undefined,
}

export type Body = {
  [key: string]: | Array<string>
    | string
    | boolean
    | number
    | FileData
    | typeof undefined,
}

export type Options = {
  body?: Body,
  query?: Query,
  headers?: Headers,
}
