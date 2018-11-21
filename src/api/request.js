/* @flow */
import axios from 'axios'
import buildFormData from '../util/buildFormData'
import defaultSettings from '../default-settings'
import type {UploadcareSettings} from '../types'

export type Query = {
  [key: string]: string | boolean | number | void,
}

export type Body = {
  source?: string,
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

export type RequestResponse = {
  data: {} | ErrorResponse,
}

export type ErrorResponse = {|
  error: {
    status_code: number,
    content: string,
  }
|}

/* Set max upload body size for node.js to 50M (default is 10M) */
const MAX_CONTENT_LENGTH = 50 * 1000 * 1000

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
 * @param {UploadcareSettings} [settings] - Uploadcare Settings
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
}: RequestConfig, settings: UploadcareSettings = {}): Promise<RequestResponse> {
  /*
  TODO Add support of all Uploadcare Settings
  */
  const actualSettings: UploadcareSettings = Object.assign({}, defaultSettings, settings)
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
