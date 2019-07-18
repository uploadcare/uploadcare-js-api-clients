import {FileData} from '../../types'
import {BaseProgress} from '../base'
import {CancelableInterface} from '../types'

export type Query = {
  [key: string]: string | string[] | boolean | number | void,
}

export type Body = {
  [key: string]: Array<string>
    | string
    | boolean
    | number
    | FileData
    | void,
}

export type Headers = {
  [key: string]: string,
}

export type HandleProgressFunction = {
  (progressEvent: BaseProgress): void
}

export type RequestOptions = {
  method?: string,
  path: string,
  query?: Query,
  body?: Body,
  headers?: Headers,
  baseURL?: string,
  onUploadProgress?: HandleProgressFunction,
  retryThrottledMaxTimes?: number
}

export type RequestResponse = {
  headers?: object,
  url: string,
  data: any,
}

export interface RequestInterface extends Promise<RequestResponse>, CancelableInterface {}
