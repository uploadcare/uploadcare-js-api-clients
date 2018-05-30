/* @flow */
import axios from 'axios'
import qs from 'query-string'

export type Method = 'GET' | 'POST' | 'PUT'
export type Options = {
  data: string | {} | ArrayBuffer | Buffer | FormData | File | Blob,
  query: {
    [key: string]: string,
  },
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

const BASE_ENDPOINT = 'https://upload.uploadcare.com/'

/**
 *
 *
 * @export
 * @returns
 */
export function request(
  method: Method,
  path: string,
  options: Options,
): UCRequest {
  const source = axios.CancelToken.source()
  let progressListeners: Array<ProgressListener> = []
  const url =
    BASE_ENDPOINT + path + '/?jsonerrors=1&' + qs.stringify(options.query)

  const promise = axios({
    method,
    url,
    cancelToken: source.token,
    data: options.data,
    onUploadProgress: (event: ProgressEvent) => {
      const {total, loaded} = event

      progressListeners.forEach(cb =>
        cb({
          total,
          loaded,
        }),
      )
    },
  })
    .then(({status, data}) => {
      if (data.error) {
        return {
          code: data.error.status_code,
          data,
        }
      }

      return {
        code: status,
        data,
      }
    })
    .catch(thrown => {
      if (axios.isCancel(thrown)) {
        throw thrown.message
      }

      throw thrown
    })

  const cancel = () => {
    source.cancel('cancelled')
  }
  const progress = (callback: ProgressListener) => {
    progressListeners.push(callback)
  }

  return {
    promise,
    progress,
    cancel,
  }
}
