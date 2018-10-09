/* @flow */
import axios from 'axios'
import qs from 'query-string'
import FormData from 'form-data'
import {isBinaryData} from '../../util/checkers'

import type {
  ProgressListener,
  UCRequest,
  UCResponse,
  Headers,
} from '../../flow-typed'

import type {Options, Body, Query} from './flow-typed'
import {makeError} from '../../util/makeError'

// set max upload body size for node.js to 50M (default is 10M)
const maxContentLength = 50 * 1000 * 1000

/**
 * Performs request to Uploadcare Upload API
 *
 * @export
 * @param {Method} method - HTTP method
 * @param {string} path - URL path
 * @param {Options} options - request options (data and query)
 * @returns {UCRequest}
 */
export function request<T>(
  method: string,
  path: string,
  options: Options = {},
): UCRequest<T> {
  const url = buildUrl(method, path, options.query)
  const source = axios.CancelToken.source()

  let onProgress: ProgressListener | typeof undefined
  const getOnProgress = () => onProgress
  const removeOnProgress = () => (onProgress = undefined)

  const data = options.body && buildFormData(options.body)

  const axiosOptions = {
    url,
    data,
    method,
    cancelToken: source.token,
    headers: constructHeaders(options, data),
    onUploadProgress: createProgressHandler(getOnProgress),
    maxContentLength,
  }

  const promise = axios(axiosOptions)
    .then(normalizeResponse)
    .then(cleanOnResolve(removeOnProgress))
    .catch(thrown =>
      Promise.reject(
        axios.isCancel(thrown)
          ? makeError({type: 'UPLOAD_CANCEL'})
          : thrown,
      ),
    )
    .catch(cleanOnReject(removeOnProgress))

  const ucRequest = {}

  Object.assign(ucRequest, {
    promise,
    cancel: function(): void {
      source.cancel()
    },
    // TODO: make able to add multiple handlers
    progress: function(callback: ProgressListener): UCRequest<T> {
      onProgress = callback

      return this
    }.bind(ucRequest),
  })

  return ucRequest
}

/**
 *
 *
 * @param {Options} options
 * @param {FormData} data
 * @returns {Headers}
 */
function constructHeaders(options: Options, data?: FormData): Headers {
  let headers = options.headers || {}

  if (data && data.getHeaders) {
    headers = {
      ...headers,
      ...data.getHeaders(),
    }
  }

  return headers
}

/* eslint-disable max-statements, no-continue */
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

  for (let key of Object.keys(body)) {
    let value = body[key]

    if (typeof value === 'undefined') {
      continue
    }

    if (typeof value === 'boolean') {
      value = value ? '1' : '0'
    }
    else if (typeof value === 'number') {
      value = value.toString(10)
    }
    else if (Array.isArray(value)) {
      key += '[]'
      value.forEach(val => formData.append(key, val))
      continue
    }

    // if value is raw file without metadata (Buffer)
    const filename = isBinaryData(value) ? key : undefined
    const appendArgs = filename ? [key, value, filename] : [key, value]

    formData.append.apply(formData, appendArgs)
  }

  return formData
}
/* eslint-enable max-statements, no-continue */

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
function normalizeResponse<T>(response): UCResponse<T> {
  const data = response.data
  const status: number = response.status

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
