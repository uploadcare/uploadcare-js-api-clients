import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { BatchResponse } from '../../types/BatchResponse'
import { FileInfo } from '../../types/FileInfo'
import { handleApiRequest } from '../handleApiRequest'

export type StoreFilesOptions = {
  uuids: string[]
}

export type StoreFilesResponse = BatchResponse<FileInfo>

export async function storeFiles(
  options: StoreFilesOptions,
  userSettings: ApiRequestSettings
): Promise<StoreFilesResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'PUT',
      path: `/files/storage/`,
      body: options.uuids
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
