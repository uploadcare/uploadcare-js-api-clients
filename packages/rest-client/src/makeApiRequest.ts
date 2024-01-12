import { fetch, Headers, Request } from './lib/fetch/fetch.node'
import { applyDefaultSettings, UserSettings } from './settings'
import { getUserAgent } from './tools/getUserAgent'
import { RestClientError } from './tools/RestClientError'
import { retryIfFailed } from './tools/retryIfFailed'

export type ApiRequestQuery = Record<
  string,
  string | number | boolean | Date | undefined | null
>

export type ApiRequestBody = string | string[] | Record<string, unknown>

export type ApiRequestOptions = {
  method: string
  path: string
  query?: ApiRequestQuery
  body?: ApiRequestBody
}

export type ApiRequestSettings = UserSettings

export type ApiRequest = {
  request: Request
  response: Response
}

function normalizeQuery(
  input: Required<ApiRequestOptions>['query']
): Record<string, string> {
  const output: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) {
      continue
    }
    if (value instanceof Date) {
      output[key] = value.toISOString()
    } else {
      output[key] = value.toString()
    }
  }
  return output
}

function getRequestURL(
  path: ApiRequestOptions['path'],
  query: ApiRequestOptions['query'],
  apiBaseURL: Required<UserSettings>['apiBaseURL']
): string {
  const url = new URL(apiBaseURL)
  const searchParams = new URLSearchParams(query && normalizeQuery(query))
  url.pathname = path
  url.search = searchParams.toString()

  return url.toString()
}

export async function makeApiRequest(
  options: ApiRequestOptions,
  userSettings: ApiRequestSettings
): Promise<ApiRequest> {
  const { method, path, query, body } = options
  const settings = applyDefaultSettings(userSettings)

  if (!settings.authSchema) {
    throw new RestClientError('authSchema is required')
  }

  const url = getRequestURL(path, query, settings.apiBaseURL)
  const requestBody = body && JSON.stringify(body)
  const unsignedRequest = new Request(url, {
    method: method,
    body: requestBody,
    headers: new Headers({
      'Content-Type': 'application/json',
      'User-Agent': getUserAgent({
        publicKey: settings.authSchema.publicKey,
        integration: settings.integration,
        userAgent: settings.userAgent
      })
    })
  })

  const requestHeaders = await settings.authSchema.getHeaders(unsignedRequest)
  const signedRequest = new Request(url, {
    method: method,
    body: requestBody,
    headers: requestHeaders
  })

  const response = await retryIfFailed(() => fetch(signedRequest), {
    retryThrottledRequestMaxTimes: settings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes: settings.retryNetworkErrorMaxTimes
  })

  return {
    request: signedRequest,
    response
  }
}
