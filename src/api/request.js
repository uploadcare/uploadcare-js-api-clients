/* @flow */
import axios from 'axios'
import FormData from 'form-data'
import defaultSettings from '../default-settings'
import type {DefaultSettings} from '../default-settings'
import type {Settings} from '../types'

export type RequiredSettings = DefaultSettings & Settings

export type Query = {
  [key: string]: string | boolean | number | void,
}

export type Body = {
  UPLOADCARE_PUB_KEY?: string,
  source?: string,
  file?: string,
  file_name?: string,
}

export type Headers = {
  [key: string]: string,
}

export type RequestConfig = {
  method?: string,
  path: string,
  query?: Query,
  body?: Body,
  headers?: Headers,
  baseURL?: string,
}

export type RequestResponse = Promise<{
  data: {} | ErrorResponse,
}>

export type ErrorResponse = {|
  error: {
    status_code: number,
    content: string,
  }
|}

/* Set max upload body size for node.js to 50M (default is 10M) */
const MAX_CONTENT_LENGTH = 50 * 1000 * 1000
const DEFAULT_FILE_NAME = 'original'

/**
 * Performs request to Uploadcare Upload API
 *
 * @export
 * @param {RequestConfig} config – The config options for making requests.
 * @param {string} [config.method=GET] – The request method.
 * @param {string} config.path – The path to requested method, without endpoint and with slashes.
 * @param {Object} [config.query] – The URL parameters.
 * @param {Object} [config.body] – The data to be sent as the body. Only for 'PUT', 'POST', 'PATCH'.
 * @param {Object} [config.headers] – The custom headers to be sent.
 * @param {string} [config.baseURL] – The Upload API endpoint.
 * @param {Settings} [settings] - Uploadcare Settings
 * @returns {Promise}
 */
export default function request({
  method,
  path,
  query,
  body,
  headers,
  baseURL,
  ...axiosOptions
}: RequestConfig, settings: Settings = {}): RequestResponse {
  /*
  TODO Add support of all Uploadcare Settings
  */
  const actualSettings: RequiredSettings = {
    ...defaultSettings,
    ...settings,
  }

  const data = body && buildFormData({
    ...body,
    source: body.source || 'local',
  })

  return axios({
    method: method || 'GET',
    baseURL: baseURL || actualSettings.baseURL,
    url: path,
    params: {
      jsonerrors: 1,
      ...query,
    },
    data,
    maxContentLength: MAX_CONTENT_LENGTH,
    headers: {
      'X-UC-User-Agent': actualSettings.userAgent,
      ...headers,
      ...((data && data.getHeaders) ? data.getHeaders() : {}),
    },
    ...axiosOptions,
  })
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
      const fileName = body.file_name || DEFAULT_FILE_NAME

      formData.append('file', value, fileName)
    }
    else {
      formData.append(key, value)
    }
  }

  return formData
}
