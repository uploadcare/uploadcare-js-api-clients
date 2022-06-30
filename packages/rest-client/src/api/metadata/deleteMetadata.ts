import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { handleResponse } from '../handleResponse'

export type DeleteMetadataOptions = {
  uuid: string
  key: string
}

export type DeleteMetadataResponse = void

export async function deleteMetadata(
  options: DeleteMetadataOptions,
  userSettings: ApiRequestSettings
): Promise<DeleteMetadataResponse> {
  const response = await apiRequest(
    {
      method: 'DELETE',
      path: `/files/${options.uuid}/metadata/${options.key}/`
    },
    userSettings
  )
  return handleResponse({ response, okCodes: [204] })
}
