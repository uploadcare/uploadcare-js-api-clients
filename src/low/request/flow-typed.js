/* @flow */
import type {Headers, FileData} from '../../flow-typed'

export type Query = {
  [key: string]: string | boolean | number | void,
}

export type Body = {
  [key: string]: | Array<string>
    | string
    | boolean
    | number
    | FileData
    | void,
}

export type Options = {
  body?: Body,
  query?: Query,
  headers?: Headers,
}
