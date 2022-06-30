import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { BatchResponse } from '../../types/BatchResponse'
import { FileInfo } from '../../types/FileInfo'
import { handleResponse } from '../handleResponse'

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
  return handleResponse({ response, okCodes: [200] })
}
