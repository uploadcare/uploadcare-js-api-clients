/* @flow */
import {CancelToken, isCancel} from 'axios'
import request from './request'
import type {RequestOptions, RequestResponse} from './request'

export type UploadProgressEvent = {
  status: 'uploading' | 'uploaded' | 'canceled' | 'error',
  progress: number,
}

export type UploadCancelEvent = {
  progress: number,
}

export type Uploading = {|
  promise: Promise<RequestResponse>,
  onProgress: ?(event: UploadProgressEvent) => void,
  onCancel: ?(event: UploadCancelEvent) => void,
  cancel: Function,
|}

/**
 * Performs uploading request to Uploadcare Upload API. Can be canceled and has progress.
 *
 * @param {RequestOptions} options – The options for making requests.
 * @param {string} [options.method=GET] – The request method.
 * @param {string} options.path – The path to requested method, without endpoint and with slashes.
 * @param {Object} [options.query] – The URL parameters.
 * @param {Object} [options.body] – The data to be sent as the body. Only for 'PUT', 'POST', 'PATCH'.
 * @param {Object} [options.headers] – The custom headers to be sent.
 * @param {string} [options.baseURL] – The Upload API endpoint.
 * @param {string} [options.userAgent] – The info about a library that use this request.
 * @return {{promise: Promise<RequestResponse>, onProgress: null, onCancel: null, cancel}}
 */
export default function uploadRequest(options: RequestOptions): Uploading {
  const source = CancelToken.source()

  return {
    promise: new Promise((resolve, reject) => {
      request({
        ...options,
        onUploadProgress: (progressEvent) => progressEvent,
        cancelToken: source.token,
      })
        .then(response => resolve(response))
        .catch(error => {
          reject(isCancel(error) ? 'Request canceled' : error)
        })
    }),
    onProgress: null,
    onCancel: null,
    cancel: source.cancel,
  }
}
