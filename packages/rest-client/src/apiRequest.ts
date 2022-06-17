import { fetch, Request, Headers, Response } from './lib/fetch/fetch.node'
import { Settings, defaultSettings } from './settings'

export type ApiRequestPayload = Record<
  string,
  string | number | boolean | Date | undefined | null
>

export type ApiRequestOptions = {
  method: string
  path: string
  settings: Settings
  query?: ApiRequestPayload
  body?: ApiRequestPayload
}

function normalizeQuery(input: ApiRequestPayload): Record<string, string> {
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
  apiBaseURL: Required<ApiRequestOptions['settings']>['apiBaseURL']
): string {
  const url = new URL(apiBaseURL)
  const searchParams = new URLSearchParams(query && normalizeQuery(query))
  url.pathname = path
  url.search = searchParams.toString()

  return url.toString()
}

export async function apiRequest(
  options: ApiRequestOptions
): Promise<Response> {
  const { method, path, query, body } = options
  const settings: Required<Settings> = {
    ...defaultSettings,
    ...options.settings
  }

  if (!settings.authSchema) {
    throw new Error('authSchema is required')
  }
  const url = getRequestURL(path, query, settings.apiBaseURL)
  const unsignedRequest = new Request(url, {
    method: method,
    body: body && JSON.stringify(body),
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  })
  const headers = await settings.authSchema.getHeaders(unsignedRequest)
  const signedRequest = new Request(unsignedRequest, {
    headers,
    body: body && JSON.stringify(body)
  })

  return fetch(signedRequest)
}
