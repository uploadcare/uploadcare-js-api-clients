/* @flow */
import {CancelToken} from 'axios'
import request from './request'
import type {RequestConfig, RequestResponse} from './request'
import type {UploadcareSettings} from '../types'

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
 * @param config
 * @param settings
 * @return {{promise: Promise<RequestResponse>, onProgress: null, onCancel: null, cancel}}
 */
export default function uploadRequest(config: RequestConfig, settings: UploadcareSettings = {}): Uploading {
  const source = CancelToken.source()

  return {
    promise: request({
      ...config,
      onUploadProgress: (progressEvent) => progressEvent,
      cancelToken: source.token,
    }, settings),
    onProgress: null,
    onCancel: null,
    cancel: source.cancel,
  }
}
