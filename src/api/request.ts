import axios, {AxiosError, CancelTokenSource} from 'axios'
import * as FormData from 'form-data'
import defaultSettings, {getUserAgent} from '../defaultSettings'
import RequestError from '../errors/RequestError'
import CancelError from '../errors/CancelError'
import UploadcareError from '../errors/UploadcareError'
import RequestWasThrottledError from '../errors/RequestWasThrottledError'
import {FileData, Settings} from '../types'
import {BaseProgress} from './base'
import {Thenable} from '../tools/Thenable'
import {CancelableInterface} from './types'

export type Query = {
  [key: string]: string | string[] | boolean | number | void,
}

export type Body = {
  [key: string]: Array<string>
    | string
    | boolean
    | number
    | FileData
    | void,
}

export type Headers = {
  [key: string]: string,
}

export type HandleProgressFunction = {
  (progressEvent: BaseProgress): void
}

export type RequestOptions = {
  method?: string,
  path: string,
  query?: Query,
  body?: Body,
  headers?: Headers,
  baseURL?: string,
  onUploadProgress?: HandleProgressFunction,
}

export type RequestResponse = {
  headers?: object,
  url: string,
  data: any,
}

/* Set max upload body size for node.js to 50M (default is 10M) */
const MAX_CONTENT_LENGTH = 50 * 1000 * 1000
const DEFAULT_FILE_NAME = 'original'
const DEFAULT_RETRY_AFTER_TIMEOUT = 15000

if (process.env.BUNDLE_ENV === 'node') {
  axios.interceptors.request.use(
    function(config) {
      const {data, onUploadProgress} = config
      if (!onUploadProgress) {
        return config
      }

      const total = data.getLengthSync()

      let loaded = 0

      data.on('data', chunk => {
        loaded += chunk.length

        onUploadProgress({
          total,
          loaded,
        } as ProgressEvent)
      })

      return config
    },
    function(error) {
      return Promise.reject(error)
    }
  )
}

/**
 * Updates options with Uploadcare Settings
 *
 * @param {RequestOptions} options
 * @param {Settings} settings
 * @returns {RequestOptions}
 */
export function prepareOptions(options: RequestOptions, settings: Settings): RequestOptions {
  const newOptions = {...options}

  if (!options.baseURL && settings.baseURL) {
    newOptions.baseURL = settings.baseURL
  }

  if (settings.integration) {
    newOptions.headers = {
      ...newOptions.headers,
      'X-UC-User-Agent': getUserAgent(settings),
    }
  }

  return newOptions
}

/**
 * setTimeout as Promise.
 * @param {number} ms Timeout in milliseconds.
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Performs request to Uploadcare Upload API
 *
 * @export
 * @param {RequestOptions} options – The options for making requests.
 * @param {string} [options.method = GET] – The request method.
 * @param {string} [options.path] – The path to requested method, without endpoint and with slashes.
 * @param {Object} [options.query] – The URL parameters.
 * @param {Object} [options.body] – The data to be sent as the body. Only for 'PUT', 'POST', 'PATCH'.
 * @param {Object} [options.headers] – The custom headers to be sent.
 * @param {string} [options.baseURL] – The Upload API endpoint.
 * @param {number} retryThrottledMaxTimes – How much times retry throttled request.
 * @returns {Promise<RequestResponse>}
 */
export default function request(options: RequestOptions, retryThrottledMaxTimes: number = 1): RequestInterface {
  return new Request(options, retryThrottledMaxTimes)
}

/**
 * Constructs FormData instance from object
 * Uses 'form-data' package which internally use native FormData
 * in browsers and the polyfill in node env
 *
 * @param {Body} body
 * @returns {FormData} FormData instance
 */
export function buildFormData(body: Body): FormData {
  const formData = new FormData()

  for (let key of Object.keys(body)) {
    let value = body[key]

    if (typeof value === 'boolean') {
      value = value ? '1' : '0'
    }

    if (Array.isArray(value)) {
      value.forEach(val => formData.append(key + '[]', val))
    }
    else if (key === 'file') {
      const file = body.file as File
      const fileName = file.name || DEFAULT_FILE_NAME

      formData.append('file', value, fileName)
    }
    else {
      formData.append(key, value)
    }
  }

  return formData
}

export interface RequestInterface extends Promise<RequestResponse>, CancelableInterface {}

class Request extends Thenable<RequestResponse> implements RequestInterface {
  protected readonly promise: Promise<RequestResponse>
  protected readonly options: RequestOptions
  private readonly cancelController: CancelTokenSource
  private throttledTimes: number = 0
  private readonly retryThrottledMaxTimes: number

  constructor(options: RequestOptions, retryThrottledMaxTimes) {
    super()

    this.options = options
    this.retryThrottledMaxTimes = retryThrottledMaxTimes
    this.cancelController = axios.CancelToken.source()
    this.promise = this.getRequestPromise()
  }

  protected getRequestPromise() {
    const options = this.getRequestOptions()

    // @ts-ignore
    return axios(options)
      .catch(this.handleRequestError)
      .then(this.handleResponse)
      .catch(this.handleError)
  }

  protected getRequestOptions() {
    const {path: url, onUploadProgress} = this.options
    const method = this.getRequestMethod()
    const baseURL = this.getRequestBaseURL()
    const data = this.getRequestData()
    const params = this.getRequestParams()
    const headers = this.getRequestHeaders(data)
    const cancelToken = this.cancelController.token

    return {
      method,
      baseURL,
      url,
      params,
      data,
      maxContentLength: MAX_CONTENT_LENGTH,
      headers,
      cancelToken,
      onUploadProgress,
    }
  }

  protected getRequestMethod(): string {
    const {method} = this.options

    return method || 'GET'
  }

  protected getRequestBaseURL() {
    const {baseURL} = this.options

    return baseURL || defaultSettings.baseURL
  }

  protected getRequestParams() {
    const {query} = this.options

    return {
      jsonerrors: 1,
      ...query,
    }
  }

  protected getRequestData() {
    const {body} = this.options

    if (body) {
      const newBody = body.source ? {
        source: body.source,
        ...body
      } : body

      return buildFormData(newBody)
    }

    return null
  }

  protected getRequestHeaders(data) {
    const {headers} = this.options

    return {
      'X-UC-User-Agent': getUserAgent(),
      ...headers,
      ...((data && data.getHeaders) ? data.getHeaders() : {}),
    }
  }

  private handleRequestError = (error: AxiosError) => {
    const {path: url} = this.options

    if (axios.isCancel(error)) {
      throw new CancelError()
    }

    if (error.response) {
      throw new RequestError({
        headers: error.config.headers,
        url: error.config.url || url,
      }, {
        status: error.response.status,
        statusText: error.response.statusText,
      })
    }

    throw error
  }

  private handleError = (error: Error) => {
    if (error.name === 'RequestWasThrottledError'
      && (this.throttledTimes <= this.retryThrottledMaxTimes)
    ) {
      const timeout = this.getTimeoutFromThrottledRequest(error as RequestWasThrottledError)
        || DEFAULT_RETRY_AFTER_TIMEOUT

      return delay(timeout).then(() => this.getRequestPromise())
    }

    return Promise.reject(error)
  }

  private handleResponse = response => {
    const {path} = this.options
    const url = response.config.url || path

    if (response.data.error) {
      const {status_code: code, content} = response.data.error
      const errorRequestInfo = {
        headers: response.config.headers,
        url,
      }
      const errorResponseInfo = {
        status: code || response.data.error.slice(-3),
        statusText: content || response.data.error,
      }

      // If request was throttled
      if (code === 429) {
        this.throttledTimes++
        throw new RequestWasThrottledError(
          errorRequestInfo,
          errorResponseInfo,
          `Request was throttled more than ${this.retryThrottledMaxTimes}`
        )
      }

      throw new UploadcareError(errorRequestInfo, errorResponseInfo)
    }

    return {
      headers: response.headers,
      url,
      data: response.data,
    }
  }

  private getTimeoutFromThrottledRequest = (error: RequestWasThrottledError) => {
    const {headers} = error.request

    return headers['x-throttle-wait-seconds'] * 1000 || null
  }

  cancel = (): void => this.cancelController.cancel()
}
