/* @flow */

import axios from 'axios'

import type {MultipartUploadRequest, MultipartUploadResponse, Options} from './flow-typed'

import type {ProgressListener, FileData} from '../../flow-typed'

// set max upload body size for node.js to 50M (default is 10M)
const maxContentLength = 50 * 1000 * 1000

/**
 * Perform upload request to the part URL
 *
 * @export
 * @param {string} partUrl
 * @param {FileData} file
 * @param {Options} options
 * @returns {MultipartUploadRequest}
 */
export function multipartUpload(
  partUrl: string,
  file: FileData,
  options: Options = {},
): MultipartUploadRequest {
  const source = axios.CancelToken.source()

  let onProgress: ProgressListener | typeof undefined
  const getOnProgress = () => onProgress
  const removeOnProgress = () => (onProgress = undefined)

  const axiosOptions = {
    data: file,
    url: partUrl,
    method: 'PUT',
    cancelToken: source.token,
    headers: options.headers || {},
    onUploadProgress: createProgressHandler(getOnProgress),
    maxContentLength,
  }

  const promise = axios(axiosOptions)
    .then(normalizeResponse)
    .then(cleanOnResolve(removeOnProgress))
    .catch(cleanOnReject(removeOnProgress))

  const uploadRequest = {}

  Object.assign(uploadRequest, {
    promise,
    cancel: function(): void {
      source.cancel()
    },
    progress: function(callback: ProgressListener): MultipartUploadRequest {
      onProgress = callback

      return this
    }.bind(uploadRequest),
  })

  return uploadRequest
}

/**
 * Create handler for axios onUploadProgress event
 * It calls user defined progress listener inside
 *
 * @param {() => ProgressListener} getOnProgress - function to get progress listener
 * @returns {(event: ProgressEvent) => void} onUploadProgress handler
 */
function createProgressHandler(
  getOnProgress: () => ProgressListener | typeof undefined,
): (event: ProgressEvent) => void {
  return (event: ProgressEvent) => {
    const {total, loaded} = event
    const onProgress = getOnProgress()

    onProgress &&
      onProgress({
        total,
        loaded,
      })
  }
}

/**
 * Transorms axios's response object to MultipartUploadResponse format
 *
 * @param {AxiosXHR} response - Axios response
 * @returns {MultipartUploadResponse} MultipartUploadResponse
 */
function normalizeResponse(response): MultipartUploadResponse {
  const {status} = response

  return {code: status}
}

/**
 * Run clean callback on promise resolve
 *
 * @template T argument type
 * @param {() => void} clean callback
 * @returns {(arg: T) => T} function to pass to then
 */
function cleanOnResolve<T>(clean: () => void): (arg: T) => T {
  return arg => {
    clean()

    return arg
  }
}

/**
 * Run clean callback on promise reject
 *
 * @template T argument type
 * @param {() => void} clean callback
 * @returns {(arg: T) => Promise<T>} function to pass to then
 */
function cleanOnReject<T>(clean: () => void): (arg: T) => Promise<T> {
  return arg => {
    clean()

    return Promise.reject(arg)
  }
}
