import { camelizeObject } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { ServerErrorResponse } from '../../types/ServerErrorResponse'
import { RestClientError } from '../../tools/RestClientError'
import { FileInfo } from '../../types/FileInfo'

export type DeleteFileOptions = {
  uuid: string
}

export type DeleteFileResponse = FileInfo

export async function deleteFile(
  options: DeleteFileOptions,
  userSettings: ApiRequestSettings
): Promise<DeleteFileResponse> {
  const response = await apiRequest(
    {
      method: 'DELETE',
      path: `/files/${options.uuid}/storage/`
    },
    userSettings
  )

  const json = (await response.json()) as Record<string, unknown>

  if (response.status !== 200) {
    throw new RestClientError((json as ServerErrorResponse).detail)
  }

  return camelizeObject(json) as DeleteFileResponse
}
