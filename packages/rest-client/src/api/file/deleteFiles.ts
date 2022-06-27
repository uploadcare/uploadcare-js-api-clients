import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { BatchResponse } from '../../types/BatchResponse'
import { FileInfo } from '../../types/FileInfo'
import { handleResponse } from '../handleResponse'

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
  return handleResponse({ response, okCodes: [200] })
}
