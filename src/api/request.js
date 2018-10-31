/* @flow */
import axios from 'axios'
import buildFormData from '../util/build-form-data'
import defaultSettings from '../default-settings'
import type {Query, Body, Headers} from '../types'

export type RequestConfig = {
  method?: string,
  path: string,
  query?: Query,
  body?: Body,
  headers?: Headers,
  baseURL?: string,
}

export type UploadcareSettings = {}

export type Response = {
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
}: RequestConfig, settings: UploadcareSettings = {}): Promise<Response> {
  /*
  TODO Add support of all Uploadcare Settings
  */
  const actualSettings = {
    ...defaultSettings,
    ...settings,
  }
  const data = body && buildFormData({
    ...body,
    source: body.source || 'local',
  })
  const config = {
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
  }

  return axios(config)
}
