/* @flow */
import axios from 'axios'
import buildFormData from '../util/build-form-data'
import defaultSettings from '../default-settings'
import type {Query, Body, Headers} from '../flow-typed'

type Config = {
  method?: string,
  path: string,
  query?: Query,
  body?: Body,
  headers?: Headers,
  baseURL?: string,
}

/* Set max upload body size for node.js to 50M (default is 10M) */
const MAX_CONTENT_LENGTH = 50 * 1000 * 1000

/**
 * Performs request to Uploadcare Upload API
 *
 * @export
 * @param {Config} config – The config options for making requests.
 * @param {string} [config.method=GET] – The request method.
 * @param {string} config.path – The path to requested method, without endpoint and with slashes.
 * @param {Object} [config.query] – The URL parameters.
 * @param {Object} [config.body] – The data to be sent as the request body. Only applicable for request methods 'PUT', 'POST', and 'PATCH'.
 * @param {Object} [config.headers] – The custom headers to be sent.
 * @param {string} [config.baseURL] – The Upload API endpoint.
 * @returns {Promise}
 */
export default function request({
  method,
  path,
  query,
  body,
  headers,
  baseURL,
  ...axiosOptions,
}: Config): Promise {
  const data = body && buildFormData({
    ...body,
    source: body.source || 'local',
  })
  const config = {
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
      'X-UC-User-Agent': defaultSettings.userAgent,
      ...headers,
      ...(data ? data.getHeaders() : {}),
    },
    ...axiosOptions,
  }

  return axios(config)
}
