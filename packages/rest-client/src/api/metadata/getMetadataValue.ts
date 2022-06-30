import { Metadata } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { handleResponse } from '../handleResponse'

export type GetMetadataValueOptions = {
  uuid: string
  key: string
}

export type GetMetadataValueResponse = Metadata

export async function getMetadataValue(
  options: GetMetadataValueOptions,
  userSettings: ApiRequestSettings
): Promise<GetMetadataValueResponse> {
  const response = await apiRequest(
    {
      method: 'GET',
      path: `/files/${options.uuid}/metadata/${options.key}/`
    },
    userSettings
  )
  return handleResponse({ response, okCodes: [200] })
}
