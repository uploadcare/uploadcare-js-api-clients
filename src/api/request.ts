import axios, {CancelTokenSource} from 'axios'
import * as FormData from 'form-data'
import FormDataNode from 'formdata-node'
import defaultSettings, {getUserAgent} from '../defaultSettings'
import RequestError from '../errors/RequestError'
import CancelError from '../errors/CancelError'
import UploadcareError from '../errors/UploadcareError'
import {FileData, Settings} from '../types'
import {BaseProgress} from './base'
import {Thenable} from '../tools/Thenable'
import {CancelableInterface} from './types'
import {isNode} from '../../test/_helpers'

export type Query = {
  [key: string]: string | boolean | number | void,
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
 * @returns {Promise<RequestResponse>}
 */
export default function request(options: RequestOptions): RequestInterface {
  return new Request(options)
}

/**
 * Constructs FormData instance from object
 * Uses 'form-data' package which internally use native FormData
 * in browsers and the polyfill in node env
 *
 * @param {Body} body
 * @returns {FormData} FormData instance
 */
export function buildFormData(body: Body) {
  const keys = Object.keys(body)
  const bodyHasFile = keys.includes('file')
  const formData = isNode() && bodyHasFile ? new FormDataNode() : new FormData()

  for (let key of keys) {
    let value = body[key]

    if (typeof value === 'boolean') {
      value = value ? '1' : '0'
    }

    if (Array.isArray(value)) {
      value.forEach(val => formData.append(key + '[]', val))
    }
    else if (key === 'file') {
      const file = value as File
      const fileName = file.name || DEFAULT_FILE_NAME

      formData.append('file', value, fileName)
    }
    else {
      formData.append(key, value)
    }
  }

  // @ts-ignore
  return formData
}

export interface RequestInterface extends Promise<RequestResponse>, CancelableInterface {}

class Request extends Thenable<RequestResponse> implements RequestInterface {
  protected readonly promise: Promise<RequestResponse>
  protected readonly options: RequestOptions
  private readonly cancelController: CancelTokenSource

  constructor(options: RequestOptions) {
    super()

    this.options = options
    this.cancelController = axios.CancelToken.source()
    this.promise = this.getRequestPromise()
  }

  protected getRequestPromise() {
    const options = this.getRequestOptions()
    const {data, onUploadProgress} = options

    this.handleNodeProgress(data, onUploadProgress)

    // @ts-ignore
    return axios(options)
      .catch(this.handleError)
      .then(this.handleResponse)
      .catch((error) => Promise.reject(error))
  }

  protected handleNodeProgress(data, onUploadProgress: HandleProgressFunction | undefined) {
    if (data && data.stream && typeof onUploadProgress !== 'undefined') {
      const stream = data.stream

      data.getComputedLength().then(total => {
        let loaded = 0

        stream.on('data', (chunk) => {
          loaded += chunk.length

          onUploadProgress({
            total,
            loaded,
            lengthComputable: true,
          } as ProgressEvent)
        })
      })
    }
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
      // @ts-ignore
      data: isNode() ? (data && data.stream) : data,
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
    const headersFromData = (data && data.getHeaders) ?
      data.getHeaders() : (data && data.headers) ?
        data.headers : {}

    return {
      'X-UC-User-Agent': getUserAgent(),
      ...headers,
      ...headersFromData,
    }
  }

  private handleError = (error) => {
    if (axios.isCancel(error)) {
      throw new CancelError()
    }

    if (error.response) {
      throw new RequestError({
        headers: error.config.headers,
        url: error.config.url,
      }, {
        status: error.response.status,
        statusText: error.response.statusText,
      })
    }

    throw error
  }

  private handleResponse = response => {
    const {path} = this.options
    const url = response.config.url || path

    if (response.data.error) {
      const {status_code: code, content} = response.data.error

      throw new UploadcareError({
        headers: response.config.headers,
        url,
      }, {
        status: code || response.data.error.slice(-3),
        statusText: content || response.data.error,
      })
    }

    return {
      headers: response.headers,
      url,
      data: response.data,
    }
  }

  cancel = (): void => this.cancelController.cancel()
}
