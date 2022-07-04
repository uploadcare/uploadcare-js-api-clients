import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { FileInfo } from '../../types/FileInfo'
import { handleApiRequest } from '../handleApiRequest'

export type StoreFileOptions = {
  uuid: string
}

export type StoreFileResponse = FileInfo

export async function storeFile(
  options: StoreFileOptions,
  userSettings: ApiRequestSettings
): Promise<StoreFileResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'PUT',
      path: `/files/${options.uuid}/storage/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
