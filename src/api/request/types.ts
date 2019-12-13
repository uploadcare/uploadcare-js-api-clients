import * as FormData from 'form-data'
import CancelController from '../../CancelController'

export type Headers = {
  [key: string]: string | string[] | undefined
}

export type RequestOptions = {
  method?: string
  url: string
  query?: string
  data?: FormData
  headers?: Headers
  cancel?: CancelController
  onProgress?: (event: any) => void
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
  }
}
