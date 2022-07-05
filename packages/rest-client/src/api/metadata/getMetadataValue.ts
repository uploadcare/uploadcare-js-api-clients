import { Metadata } from '@uploadcare/api-client-utils'
import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { handleApiRequest } from '../handleApiRequest'

export type GetMetadataValueOptions = {
  uuid: string
  key: string
}

export type GetMetadataValueResponse = Metadata

export async function getMetadataValue(
  options: GetMetadataValueOptions,
  userSettings: ApiRequestSettings
): Promise<GetMetadataValueResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/files/${options.uuid}/metadata/${options.key}/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
