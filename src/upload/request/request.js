/* @flow */
import axios from 'axios'
import qs from 'query-string'
import FormData from 'form-data'

import type {
  Body,
  Query,
  Options,
  UCRequest,
  UCResponse,
  ProgressListener,
  ServerResponse,
} from './flow-typed'

/**
 * Performs request to Uploadcare Upload API
 *
 * @export
 * @param {Method} method - HTTP method
 * @param {string} path - URL path
 * @param {Options} options - request options (data and query)
 * @returns {UCRequest}
 */
export function request(
  method: string,
  path: string,
  options: Options = {},
): UCRequest {
  const url = buildUrl(method, path, options.query)
  const source = axios.CancelToken.source()

  let onProgress: ProgressListener | typeof undefined
  const getOnProgress = () => onProgress
  const removeOnProgress = () => (onProgress = undefined)

  const axiosOptions = {
    url,
    method,
    cancelToken: source.token,
    headers: options.headers || {},
    data: options.body && buildFormData(options.body),
    onUploadProgress: createProgressHandler(getOnProgress),
  }

  const promise = axios(axiosOptions)
    .then(normalizeResponse)
    .then(cleanOnResolve(removeOnProgress))
    .catch(cleanOnReject(removeOnProgress))

  const ucRequest = {}

  Object.assign(ucRequest, {
    promise,
    cancel: function(): void {
      source.cancel('cancelled')
    },
    progress: function(callback: ProgressListener): UCRequest {
      onProgress = callback

      return this
    }.bind(ucRequest),
  })

  return ucRequest
}

/**
 * Constructs FormData instance from object
 * Uses 'form-data' package which internally use native FormData
 * in browsers and the polyfill in node env
 *
 * @param {Body} body
 * @returns {FormData} FormData instance
 */
function buildFormData(body: Body): FormData {
  const formData = new FormData()

  for (const key of Object.keys(body)) {
    let value = body[key]

    if (typeof value !== 'undefined') {
      if (typeof value === 'boolean') {
        value = value ? '1' : '0'
      }
      else if (typeof value === 'number') {
        value = value.toString(10)
      }

      formData.append(key, value)
    }
  }

  return formData
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
 * Constructs the URL on which the request will be sent
 *
 * @param {string} method - HTTP method
 * @param {string} path - URL path
 * @param {Object} query - object with query parameters
 * @returns {string} url - resulting URL
 */
function buildUrl(method: string, path: string, query: Query = {}): string {
  const base = 'https://upload.uploadcare.com/'
  const url = base + path + '/?jsonerrors=1&' + qs.stringify(query)

  return url
}

/**
 * Transorms axios's response object to UCResponse format
 *
 * @param {AxiosXHR} response - Axios response
 * @returns {UCResponse} UCResponse
 */
function normalizeResponse(response): UCResponse {
  const {status, data}: {status: number, data: ServerResponse} = response

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
