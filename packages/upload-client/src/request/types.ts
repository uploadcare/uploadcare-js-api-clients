import NodeFormData from 'form-data'
import {
  ComputableProgressInfo,
  ProgressCallback,
  UnknownProgressInfo
} from '../api/types'
import { SupportedFileInput } from '../types'

export type Headers = {
  [key: string]: string | string[] | undefined
}

export type RequestOptions = {
  method?: string
  url: string
  query?: string
  data?: NodeFormData | FormData | SupportedFileInput
  headers?: Headers
  signal?: AbortSignal
  onProgress?: ProgressCallback<ComputableProgressInfo | UnknownProgressInfo>
}

export type ErrorRequestInfo = {
  method?: string
  url: string
  query?: string
  data?: NodeFormData | FormData | SupportedFileInput
  headers?: Headers
}

export type RequestResponse = {
  request: RequestOptions
  data: string
  headers: Headers
  status?: number
}

export type FailedResponse = {
  error: {
    content: string
    statusCode: number
    errorCode: string
  }
}
