import { fetch, Request, Headers, Response } from './lib/fetch/fetch.node'
import { Settings } from './settings'

export type ApiRequestQuery = Record<
  string,
  string | number | boolean | Date | undefined
>

export type ApiRequestOptions = {
  method: string
  path: string
  settings: Required<Settings>
  query?: ApiRequestQuery
}

function normalizeQuery(input: ApiRequestQuery): Record<string, string> {
  const output: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'undefined') {
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

export async function apiRequest({
  method,
  path,
  settings,
  query = {}
}: ApiRequestOptions): Promise<Response> {
  if (!settings.authSchema) {
    throw new Error('authSchema is required')
  }

  const url = new URL(settings.apiBaseURL)
  const searchParams = new URLSearchParams(normalizeQuery(query))
  url.pathname = path
  url.search = searchParams.toString()

  const unsignedRequest = new Request(url.toString(), {
    method: method,
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  })
  const headers = await settings.authSchema.getHeaders(unsignedRequest)
  const signedRequest = new Request(unsignedRequest, { headers })

  return fetch(signedRequest)
}
