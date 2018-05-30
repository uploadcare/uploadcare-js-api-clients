/* @flow */

export type ProgressListener = ({total: number, loaded: number}) => void

export interface Request<T> {
  promise: Promise<T>,
  cancel(): void,
  progress(callback: ProgressListener): Request<T>,
}

export type Headers = {
  [name: string]: string,
}

export type FileData = Blob | File | Buffer
