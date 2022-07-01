import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { handleApiRequest } from '../handleApiRequest'

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
  const apiRequest = await makeApiRequest(
    {
      method: 'PUT',
      path: `/files/${options.uuid}/metadata/${options.key}/`,
      body: options.value
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200, 201] })
}
