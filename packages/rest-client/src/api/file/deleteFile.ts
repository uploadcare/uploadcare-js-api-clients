import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { FileInfo } from '../../types/FileInfo'
import { handleResponse } from '../handleResponse'

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

  return handleResponse({ response, okCodes: [200] })
}
