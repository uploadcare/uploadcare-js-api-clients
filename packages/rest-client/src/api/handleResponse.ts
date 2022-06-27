import { camelizeKeys } from '@uploadcare/api-client-utils'
import { RestClientError } from '../tools/RestClientError'
import { ServerErrorResponse } from '../types/ServerErrorResponse'

type HandleResponseOptions = {
  response: Response
  okCodes: number[]
}

const CAMELIZE_IGNORED_KEYS = ['metadata', 'problems']

export async function handleResponse<T>(
  options: HandleResponseOptions
): Promise<T> {
  const { response, okCodes } = options

  const json = (await response.json()) as Record<string, unknown>

  if (!okCodes.includes(response.status)) {
    throw new RestClientError((json as ServerErrorResponse).detail)
  }

  return camelizeKeys(json, {
    ignoreKeys: CAMELIZE_IGNORED_KEYS
  }) as T
}
