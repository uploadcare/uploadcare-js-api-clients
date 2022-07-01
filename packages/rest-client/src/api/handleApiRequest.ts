import { camelizeKeys } from '@uploadcare/api-client-utils'
import { ApiRequest } from '../makeApiRequest'
import { getAcceptHeader } from '../tools/getAcceptHeader'
import { RestClientError } from '../tools/RestClientError'
import { ServerErrorResponse } from '../types/ServerErrorResponse'

type HandleResponseOptions = {
  apiRequest: ApiRequest
  okCodes: number[]
  camelize?: boolean
}

const CAMELIZE_IGNORE_KEYS = ['metadata', 'problems']
const NO_CONTENT_STATUS = 204

const isJsonContentType = (type: string | null) =>
  type && ['application/json', getAcceptHeader()].includes(type)

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
    throw new RestClientError((json as ServerErrorResponse).detail, {
      response,
      request
    })
  }

  if (!camelize) {
    return json as ResponseType
  }

  return camelizeKeys(json, {
    ignoreKeys: CAMELIZE_IGNORE_KEYS
  }) as ResponseType
}
