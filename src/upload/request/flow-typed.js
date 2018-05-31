/* @flow */
import type {Request, ProgressListener, Headers, FileData} from '../types'

export type {ProgressListener}

export type Query = {
  [key: string]: string | boolean | number | typeof undefined,
}

export type Body = {
  [key: string]: Array<string> | string | boolean | number | FileData | typeof undefined,
}

export type Options = {
  body?: Body,
  query?: Query,
  headers?: Headers,
}

export type UCResponse = {
  code: number,
  data: {
    [key: string]: mixed,
  },
}

export type UCRequest = Request<UCResponse>

export interface ServerResponse {
  [key: string]: mixed;
  +error: {
    status_code: number,
    content: string,
  };
}
