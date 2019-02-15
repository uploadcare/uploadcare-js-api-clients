import axios from 'axios'
import * as FormData from 'form-data'
import defaultSettings, {getUserAgent} from '../defaultSettings'
import RequestError from '../errors/RequestError'
import CancelError from '../errors/CancelError'
import UploadcareError from '../errors/UploadcareError'
import {FileData, Settings} from '../types'
import {ResponseInterface} from './types'

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

export type RequestOptions = {
  method?: string,
  path: string,
  query?: Query,
  body?: Body,
  headers?: Headers,
  baseURL?: string,
}

export type RequestResponse = {
  headers?: Object,
  url: string,
  data: ResponseInterface,
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
 * @param {string} [options.method=GET] – The request method.
 * @param {string} options.path – The path to requested method, without endpoint and with slashes.
 * @param {Object} [options.query] – The URL parameters.
 * @param {Object} [options.body] – The data to be sent as the body. Only for 'PUT', 'POST', 'PATCH'.
 * @param {Object} [options.headers] – The custom headers to be sent.
 * @param {string} [options.baseURL] – The Upload API endpoint.
 * @returns {Promise<RequestResponse>}
 */
export default function request({
  method,
  path,
  query,
  body,
  headers,
  baseURL,
  ...axiosOptions
}: RequestOptions): Promise<RequestResponse> {
  const data = body && buildFormData({
    ...body,
    source: body.source || 'local',
  })

  // TODO: Fix ts-ignore
  // @ts-ignore
  return axios({
    method: method || 'GET',
    baseURL: baseURL || defaultSettings.baseURL,
    url: path,
    params: {
      jsonerrors: 1,
      ...query,
    },
    data,
    maxContentLength: MAX_CONTENT_LENGTH,
    headers: {
      'X-UC-User-Agent': getUserAgent(),
      ...headers,
      ...((data && data.getHeaders) ? data.getHeaders() : {}),
    },
    ...axiosOptions,
  })
    .catch((error) => {
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
    })
    .then(axiosResponse => {
      if (axiosResponse.data.error) {
        const {status_code: code, content} = axiosResponse.data.error

        throw new UploadcareError({
          headers: axiosResponse.config.headers,
          // TODO: Fix ts-ignore
          // @ts-ignore
          url: axiosResponse.config.url,
        }, {
          status: code,
          statusText: content,
        })
      }

      return axiosResponse
    })
    .then(axiosResponse => ({
      headers: axiosResponse.headers,
      url: axiosResponse.config.url,
      data: axiosResponse.data,
    }))
    .catch((error) => Promise.reject(error))
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
      // TODO: Fix ts-ignore
      // @ts-ignore
      const fileName = body.file.name || DEFAULT_FILE_NAME

      formData.append('file', value, fileName)
    }
    else {
      formData.append(key, value)
    }
  }

  return formData
}

/**
 * Creates controller to cancel any request
 *
 * @returns {*}
 */
export function createCancelController() {
  return axios.CancelToken.source()
}
