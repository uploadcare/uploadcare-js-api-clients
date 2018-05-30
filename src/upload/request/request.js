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
  options: Options,
): UCRequest {
  const url = buildUrl(method, path, options.query)
  const source = axios.CancelToken.source()
  let progressListener: ProgressListener | typeof undefined

  const formData = options.body && buildFormData(options.body)
  const headers = formData ? {'content-type': 'multipart/form-data'} : {}

  const axiosOptions = {
    url,
    method,
    headers,
    data: formData,
    cancelToken: source.token,
    onUploadProgress: createProgressHandler(() => progressListener),
  }

  const promise = axios(axiosOptions).then(normalizeResponse)

  const cancel = () => {
    source.cancel('cancelled')
  }
  const progress = (callback: ProgressListener) => {
    progressListener = callback
  }

  return {
    promise,
    progress,
    cancel,
  }
}

/**
 *
 *
 * @param {mixed} body
 * @returns {FormData}
 */
function buildFormData(body: Body): FormData {
  const formData = new FormData()

  for (const key of Object.keys(body)) {
    const value = body[key]

    formData.append(key, value)
  }

  return formData
}

/**
 * Create handler for axios onUploadProgress event
 * It calls user defined progress listener inside
 *
 * @param {() => ProgressListener} getProgressListener - function to get progress listener
 * @returns {(event: ProgressEvent) => void} onUploadProgress handler
 */
function createProgressHandler(
  getProgressListener: () => ProgressListener | typeof undefined,
): (event: ProgressEvent) => void {
  return (event: ProgressEvent) => {
    const {total, loaded} = event
    const progressListener = getProgressListener()

    progressListener &&
      progressListener({
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
function buildUrl(method: string, path: string, query: Query): string {
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
