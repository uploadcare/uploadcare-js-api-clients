import { camelizeKeys } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { ServerErrorResponse } from '../../types/ServerErrorResponse'
import { RestClientError } from '../../tools/RestClientError'
import { FileInfo } from '../../types/FileInfo'
import { BatchResponse } from '../../types/BatchResponse'

export type StoreFilesOptions = {
  uuids: string[]
}

export type StoreFilesResponse = BatchResponse<FileInfo>

export async function storeFiles(
  options: StoreFilesOptions,
  userSettings: ApiRequestSettings
): Promise<StoreFilesResponse> {
  const response = await apiRequest(
    {
      method: 'PUT',
      path: `/files/storage/`,
      body: options.uuids
    },
    userSettings
  )

  const json = (await response.json()) as Record<string, unknown>

  if (response.status !== 200) {
    throw new RestClientError((json as ServerErrorResponse).detail)
  }

  return camelizeKeys(json) as StoreFilesResponse
}
