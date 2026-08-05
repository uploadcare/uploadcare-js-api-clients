import { camelizeKeys } from '@uploadcare/api-client-utils'
import { ApiRequest } from '../makeApiRequest'
import { getAcceptHeader } from '../tools/getAcceptHeader'
import { RestClientError } from '../tools/RestClientError'
import {
  ServerErrorResponse,
  ServerValidationErrorResponse
} from '../types/ServerErrorResponse'

type HandleResponseOptions = {
  apiRequest: ApiRequest
  okCodes: number[]
  camelize?: boolean
}

const CAMELIZE_IGNORE_KEYS = ['metadata', 'problems', 'appdata']
const NO_CONTENT_STATUS = 204

const isJsonContentType = (type: string | null) =>
  type && ['application/json', getAcceptHeader()].includes(type)

/**
 * Some endpoints answer a validation failure with errors keyed by field instead
 * of a `detail` string — `POST /files/search/` is one. Without this the details
 * would be dropped and the message would degrade to the bare status.
 */
const getValidationErrors = (
  json: unknown
): ServerValidationErrorResponse | undefined => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return undefined
  }
  const entries = Object.entries(json)
  const isFieldErrors =
    entries.length > 0 &&
    entries.every(
      ([, value]) =>
        Array.isArray(value) && value.every((item) => typeof item === 'string')
    )
  return isFieldErrors ? (json as ServerValidationErrorResponse) : undefined
}

const formatValidationErrors = (errors: ServerValidationErrorResponse) =>
  Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('; ')

export async function handleApiRequest<ResponseType>(
  options: HandleResponseOptions
): Promise<ResponseType> {
  const { apiRequest, okCodes, camelize = true } = options
  const { request, response } = apiRequest

  if (response.status === NO_CONTENT_STATUS) {
    return undefined as unknown as ResponseType
  }
  if (!isJsonContentType(response.headers.get('content-type'))) {
    throw new RestClientError(undefined, {
      response,
      request
    })
  }
  const json: unknown = await response.json()
  if (!okCodes.includes(response.status)) {
    const { detail } = json as ServerErrorResponse
    const errors = detail === undefined ? getValidationErrors(json) : undefined
    throw new RestClientError(
      detail ?? (errors && formatValidationErrors(errors)),
      {
        response,
        request,
        errors
      }
    )
  }

  if (!camelize) {
    return json as ResponseType
  }

  return camelizeKeys<ResponseType>(json, {
    ignoreKeys: CAMELIZE_IGNORE_KEYS
  })
}
