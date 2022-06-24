import { camelizeKeys } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { ServerErrorResponse } from '../../types/ServerErrorResponse'
import { RestClientError } from '../../tools/RestClientError'
import { FileInfo } from '../../types/FileInfo'
import { BatchResponse } from '../../types/BatchResponse'

export type DeleteFilesOptions = {
  uuids: string[]
}

export type DeleteFilesResponse = BatchResponse<FileInfo>

export async function deleteFiles(
  options: DeleteFilesOptions,
  userSettings: ApiRequestSettings
): Promise<DeleteFilesResponse> {
  const response = await apiRequest(
    {
      method: 'DELETE',
      path: `/files/storage/`,
      body: options.uuids
    },
    userSettings
  )

  const json = (await response.json()) as Record<string, unknown>

  if (response.status !== 200) {
    throw new RestClientError((json as ServerErrorResponse).detail)
  }

  return camelizeKeys(json) as DeleteFilesResponse
}
