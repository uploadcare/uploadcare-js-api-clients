import { camelizeKeys } from '@uploadcare/api-client-utils'
import { RestClientError } from '../tools/RestClientError'
import { ServerErrorResponse } from '../types/ServerErrorResponse'

type HandleResponseOptions = {
  response: Response
  okCodes: number[]
  camelize?: boolean
}

const CAMELIZE_IGNORE_KEYS = ['metadata', 'problems']
const NO_CONTENT_STATUS = 204

export async function handleResponse<ResponseType>(
  options: HandleResponseOptions
): Promise<ResponseType> {
  const { response, okCodes, camelize = true } = options
  if (response.status === NO_CONTENT_STATUS) {
    return undefined as unknown as ResponseType
  }
  const json: unknown = await response.json()
  if (!okCodes.includes(response.status)) {
    throw new RestClientError((json as ServerErrorResponse).detail, {
      response
    })
  }

  if (!camelize) {
    return json as ResponseType
  }

  return camelizeKeys(json, {
    ignoreKeys: CAMELIZE_IGNORE_KEYS
  }) as ResponseType
}
