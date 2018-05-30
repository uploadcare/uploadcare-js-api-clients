/* @flow */

export type Method = 'GET' | 'POST' | 'PUT'

export type Query = {
  [key: string]: string,
}

export type Options = {
  body: string | {} | ArrayBuffer | Buffer | FormData | File | Blob,
  query: Query,
}

export type UCResponse = {
  code: number,
  data: {
    [key: string]: string | number | boolean,
  },
}

export type ProgressListener = ({total: number, loaded: number}) => void

export type UCRequest = {
  promise: Promise<UCResponse>,
  cancel: () => void,
  progress: (callback: ProgressListener) => void,
}
