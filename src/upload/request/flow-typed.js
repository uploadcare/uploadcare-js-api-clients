/* @flow */

export type Query = {
  [key: string]: string,
}

export type Body = {
  [key: string]: string | boolean | number | Blob | File | Buffer,
}

export type Headers = {
    [name: string]: string
  }

export type Options = {
  body?: Body,
  query?: Query,
  headers?: Headers
}

export type ProgressListener = ({total: number, loaded: number}) => void

export type UCResponse = {
  code: number,
  data: {
    [key: string]: mixed,
  },
}

export interface UCRequest {
  promise: Promise<UCResponse>,
  cancel(): void,
  progress(callback: ProgressListener): UCRequest,
}

export interface ServerResponse {
  [key: string]: mixed;
  +error: {
    status_code: number,
    content: string,
  };
}
