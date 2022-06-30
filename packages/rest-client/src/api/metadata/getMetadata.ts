import { Metadata } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { handleResponse } from '../handleResponse'

export type GetMetadataOptions = {
  uuid: string
}

export type GetMetadataResponse = Metadata

export async function getMetadata(
  options: GetMetadataOptions,
  userSettings: ApiRequestSettings
): Promise<GetMetadataResponse> {
  const response = await apiRequest(
    {
      method: 'GET',
      path: `/files/${options.uuid}/metadata/`
    },
    userSettings
  )
  return handleResponse({ response, okCodes: [200], camelize: false })
}
