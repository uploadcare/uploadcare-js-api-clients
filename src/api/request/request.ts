/* Vendors */
import axios, { AxiosError, AxiosRequestConfig, CancelTokenSource } from "axios"

import { Thenable } from "../../thenable/Thenable"
import { isNode } from "../../tools/isNode"
import buildFormData from "./buildFormData.node"
import { delay } from "./delay"
import defaultSettings, { getUserAgent } from "../../defaultSettings"
import { addMaxConcurrencyInterceptorsToAxiosInstance } from "./interceptors"

import RequestError from "../../errors/RequestError"
import CancelError from "../../errors/CancelError"
import UploadcareError from "../../errors/UploadcareError"
import RequestWasThrottledError from "../../errors/RequestWasThrottledError"

/* Types */
import {
  RequestInterface,
  RequestOptionsInterface,
  RequestResponse
} from "./types"

const REQUEST_WAS_THROTTLED_CODE = 429

export const DEFAULT_RETRY_AFTER_TIMEOUT = 15000

const nodeUploadProgress = (config: AxiosRequestConfig): AxiosRequestConfig => {
  const { data, onUploadProgress } = config
  if (!onUploadProgress) {
    return config
  }

  const total = data.getLengthSync()

  let loaded = 0

  data.on("data", chunk => {
    loaded += chunk.length

    onUploadProgress({
      total,
      loaded
    } as ProgressEvent)
  })

  return config
}

class Request extends Thenable<RequestResponse> implements RequestInterface {
  protected readonly promise: Promise<RequestResponse>
  private readonly options: RequestOptionsInterface
  private readonly cancelController: CancelTokenSource
  private throttledTimes = 0
  private readonly retryThrottledMaxTimes: number

  constructor(options: RequestOptionsInterface) {
    super()

    this.options = options
    if (
      typeof options.retryThrottledMaxTimes !== "undefined" &&
      options.retryThrottledMaxTimes >= 0
    ) {
      this.retryThrottledMaxTimes = options.retryThrottledMaxTimes
    } else {
      this.retryThrottledMaxTimes =
        defaultSettings.retryThrottledRequestMaxTimes
    }
    this.cancelController = axios.CancelToken.source()
    this.promise = this.getRequestPromise()
  }

  private getRequestPromise() {
    const options = this.getRequestOptions()
    const instance = axios.create()
    const maxConcurrentRequestsCount =
      this.options.maxConcurrentRequests ||
      defaultSettings.maxConcurrentRequests

    addMaxConcurrencyInterceptorsToAxiosInstance({
      instance,
      maxConcurrentRequestsCount
    })

    if (isNode()) {
      instance.interceptors.request.use(
        nodeUploadProgress,
        this.handleRequestError
      )
    }

    return instance(options as AxiosRequestConfig)
      .catch(this.handleRequestError)
      .then(this.handleResponse)
      .catch(this.handleError)
  }

  private getRequestOptions() {
    const { path: url, onUploadProgress } = this.options
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
      maxContentLength: defaultSettings.maxContentLength,
      headers,
      cancelToken,
      onUploadProgress
    }
  }

  private getRequestMethod(): string {
    const { method } = this.options

    return method || "GET"
  }

  private getRequestBaseURL() {
    const { baseURL } = this.options

    return baseURL || defaultSettings.baseURL
  }

  private getRequestParams() {
    const { query } = this.options

    return {
      jsonerrors: 1,
      ...query
    }
  }

  private getRequestData() {
    const { body } = this.options

    if (body) {
      const newBody = body.source
        ? {
            source: body.source,
            ...body
          }
        : body

      return buildFormData(newBody)
    }

    return null
  }

  private getRequestHeaders(data) {
    const { headers } = this.options

    return {
      "X-UC-User-Agent": getUserAgent(),
      ...headers,
      ...(data && data.getHeaders ? data.getHeaders() : {})
    }
  }

  private handleRequestError = (error: AxiosError) => {
    const { path: url } = this.options

    if (axios.isCancel(error)) {
      throw new CancelError()
    }

    if (error.response) {
      const errorRequestInfo = {
        headers: error.request.headers,
        url: error.request.url || url
      }
      const errorResponseInfo = {
        status: error.response.status,
        statusText: error.response.statusText
      }

      throw new RequestError(errorRequestInfo, errorResponseInfo)
    }

    throw error
  }

  private handleError = (error: Error) => {
    if (
      error.name === "RequestWasThrottledError" &&
      this.throttledTimes <= this.retryThrottledMaxTimes
    ) {
      const timeout =
        this.getTimeoutFromThrottledRequest(
          error as RequestWasThrottledError
        ) || DEFAULT_RETRY_AFTER_TIMEOUT

      return delay(timeout).then(() => this.getRequestPromise())
    }

    return Promise.reject(error)
  }

  private handleResponse = response => {
    const { path } = this.options
    const url = response.config.url || path

    if (response.data.error) {
      const { status_code: code, content } = response.data.error
      const errorRequestInfo = {
        headers: response.config.headers,
        url
      }
      const errorResponseInfo = {
        status: code || response.data.error.slice(-3),
        statusText: content || response.data.error
      }

      const requestError = new RequestError(errorRequestInfo, errorResponseInfo)

      // If request was throttled
      if (code === REQUEST_WAS_THROTTLED_CODE) {
        this.throttledTimes++

        throw new RequestWasThrottledError(
          requestError,
          this.retryThrottledMaxTimes
        )
      }

      throw new UploadcareError(requestError)
    }

    return {
      headers: response.headers,
      url,
      data: response.data,
      code: response.status
    }
  }

  private getTimeoutFromThrottledRequest = (
    error: RequestWasThrottledError
  ) => {
    const { headers } = error.request

    return headers["x-throttle-wait-seconds"] * 1000 || null
  }

  cancel = (): void => this.cancelController.cancel()
}

/**
 * Performs request to Uploadcare Upload API.
 *
 * @export
 * @param {RequestOptionsInterface} options – The options for making requests.
 * @param {string} [options.method = GET] – The request method.
 * @param {string} [options.path] – The path to requested method, without endpoint and with slashes.
 * @param {Object} [options.query] – The URL parameters.
 * @param {Object} [options.body] – The data to be sent as the body. Only for 'PUT', 'POST', 'PATCH'.
 * @param {Object} [options.headers] – The custom headers to be sent.
 * @param {string} [options.baseURL] – The Upload API endpoint.
 * @param {number} [options.retryThrottledMaxTimes] – How much times retry throttled request (1 by default)
 * @returns {RequestInterface}
 */
const request = (options: RequestOptionsInterface): RequestInterface => {
  return new Request(options)
}

export default request
