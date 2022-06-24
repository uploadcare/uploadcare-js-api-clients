import { camelizeKeys } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { ServerErrorResponse } from '../../types/ServerErrorResponse'
import { RestClientError } from '../../tools/RestClientError'
import { FileInfo } from '../../types/FileInfo'

export type StoreOptions = {
  uuid: string
}

export type StoreResponse = FileInfo

export async function storeFile(
  options: StoreOptions,
  userSettings: ApiRequestSettings
): Promise<StoreResponse> {
  const response = await apiRequest(
    {
      method: 'PUT',
      path: `/files/${options.uuid}/storage/`
    },
    userSettings
  )

  const json = (await response.json()) as Record<string, unknown>

  if (response.status !== 200) {
    throw new RestClientError((json as ServerErrorResponse).detail)
  }

  return camelizeKeys(json) as StoreResponse
}
