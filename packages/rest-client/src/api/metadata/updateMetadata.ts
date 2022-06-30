import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { handleResponse } from '../handleResponse'

export type UpdateMetadataOptions = {
  uuid: string
  key: string
  value: string
}

export type UpdateMetadataResponse = string

export async function updateMetadata(
  options: UpdateMetadataOptions,
  userSettings: ApiRequestSettings
): Promise<UpdateMetadataResponse> {
  const response = await apiRequest(
    {
      method: 'PUT',
      path: `/files/${options.uuid}/metadata/${options.key}/`,
      body: options.value
    },
    userSettings
  )
  return handleResponse({ response, okCodes: [200, 201] })
}
