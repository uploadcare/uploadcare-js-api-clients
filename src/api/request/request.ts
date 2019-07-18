import axios, {AxiosError, AxiosRequestConfig, CancelTokenSource} from 'axios'
import defaultSettings, {getUserAgent} from '../../defaultSettings'
import RequestError from '../../errors/RequestError'
import CancelError from '../../errors/CancelError'
import UploadcareError from '../../errors/UploadcareError'
import RequestWasThrottledError from '../../errors/RequestWasThrottledError'
import {Thenable} from '../../tools/Thenable'
import {isNode} from '../../tools/isNode'
import {RequestInterface, RequestOptions, RequestResponse} from './types'
import {buildFormData} from './buildFormData'
import {delay} from './delay'

const DEFAULT_RETRY_THROTTLED_MAX_TIMES = 1
const REQUEST_WAS_THROTTLED_CODE = 429
/* Set max upload body size for node.js to 50M (default is 10M) */
export const DEFAULT_MAX_CONTENT_LENGTH = 50 * 1000 * 1000
export const DEFAULT_FILE_NAME = 'original'
export const DEFAULT_RETRY_AFTER_TIMEOUT = 15000
export const DEFAULT_PART_SIZE = 5242880 // 5MB
export const MIN_MULTIPART_UPLOAD_SIZE = 10485760 // 10 MB

const nodeUploadProgress = (config: AxiosRequestConfig): AxiosRequestConfig => {
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
}

class Request extends Thenable<RequestResponse> implements RequestInterface {
  protected readonly promise: Promise<RequestResponse>
  private readonly options: RequestOptions
  private readonly cancelController: CancelTokenSource
  private throttledTimes: number = 0
  private readonly retryThrottledMaxTimes: number

  constructor(options: RequestOptions) {
    super()

    this.options = options
    this.retryThrottledMaxTimes = options.retryThrottledMaxTimes || DEFAULT_RETRY_THROTTLED_MAX_TIMES
    this.cancelController = axios.CancelToken.source()
    this.promise = this.getRequestPromise()
  }

  private getRequestPromise() {
    const options = this.getRequestOptions()
    const instance = axios.create()

    if (isNode()) {
      instance.interceptors.request.use(nodeUploadProgress,
        this.handleRequestError
      )
    }

    return instance(options as AxiosRequestConfig)
      .catch(this.handleRequestError)
      .then(this.handleResponse)
      .catch(this.handleError)
  }

  private getRequestOptions() {
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
      maxContentLength: DEFAULT_MAX_CONTENT_LENGTH,
      headers,
      cancelToken,
      onUploadProgress,
    }
  }

  private getRequestMethod(): string {
    const {method} = this.options

    return method || 'GET'
  }

  private getRequestBaseURL() {
    const {baseURL} = this.options

    return baseURL || defaultSettings.baseURL
  }

  private getRequestParams() {
    const {query} = this.options

    return {
      jsonerrors: 1,
      ...query,
    }
  }

  private getRequestData() {
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

  private getRequestHeaders(data) {
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
      if (code === REQUEST_WAS_THROTTLED_CODE) {
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
      code: response.status
    }
  }

  private getTimeoutFromThrottledRequest = (error: RequestWasThrottledError) => {
    const {headers} = error.request

    return headers['x-throttle-wait-seconds'] * 1000 || null
  }

  cancel = (): void => this.cancelController.cancel()
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
 * @param {number} [options.retryThrottledMaxTimes] – How much times retry throttled request.
 * @returns {Promise<RequestResponse>}
 */
const request = (options: RequestOptions): RequestInterface => {
  return new Request(options)
}

export default request
