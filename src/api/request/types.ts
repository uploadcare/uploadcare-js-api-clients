import * as NodeFormData from 'form-data'
import CancelController from '../../CancelController'

export type Headers = {
  [key: string]: string | string[] | undefined
}

export type RequestOptions = {
  method?: string
  url: string
  query?: string
  data?: NodeFormData | FormData
  headers?: Headers
  cancel?: CancelController
  onProgress?: ({ value: number }) => void
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
