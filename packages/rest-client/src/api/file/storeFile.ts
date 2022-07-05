import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { FileInfo } from '../../types/FileInfo'
import { handleApiRequest } from '../handleApiRequest'

export type StoreOptions = {
  uuid: string
}

export type StoreResponse = FileInfo

export async function storeFile(
  options: StoreOptions,
  userSettings: ApiRequestSettings
): Promise<StoreResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'PUT',
      path: `/files/${options.uuid}/storage/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
