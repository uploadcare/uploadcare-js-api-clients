import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { FileInfo } from '../../types/FileInfo'
import { handleResponse } from '../handleResponse'

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
  return handleResponse({ response, okCodes: [200] })
}
