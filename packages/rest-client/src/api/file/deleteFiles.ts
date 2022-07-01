import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { BatchResponse } from '../../types/BatchResponse'
import { FileInfo } from '../../types/FileInfo'
import { handleApiRequest } from '../handleApiRequest'

export type DeleteFilesOptions = {
  uuids: string[]
}

export type DeleteFilesResponse = BatchResponse<FileInfo>

export async function deleteFiles(
  options: DeleteFilesOptions,
  userSettings: ApiRequestSettings
): Promise<DeleteFilesResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'DELETE',
      path: `/files/storage/`,
      body: options.uuids
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
