import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { handleApiRequest } from '../handleApiRequest'

export type DeleteMetadataOptions = {
  uuid: string
  key: string
}

export type DeleteMetadataResponse = void

export async function deleteMetadata(
  options: DeleteMetadataOptions,
  userSettings: ApiRequestSettings
): Promise<DeleteMetadataResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'DELETE',
      path: `/files/${options.uuid}/metadata/${options.key}/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [204] })
}
