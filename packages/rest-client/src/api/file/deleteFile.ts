import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { FileInfo } from '../../types/FileInfo'
import { handleApiRequest } from '../handleApiRequest'

export type DeleteFileOptions = {
  uuid: string
}

export type DeleteFileResponse = FileInfo

export async function deleteFile(
  options: DeleteFileOptions,
  userSettings: ApiRequestSettings
): Promise<DeleteFileResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'DELETE',
      path: `/files/${options.uuid}/storage/`
    },
    userSettings
  )

  return handleApiRequest({ apiRequest, okCodes: [200] })
}
