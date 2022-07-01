import { Metadata } from '@uploadcare/api-client-utils'
import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { handleApiRequest } from '../handleApiRequest'

export type GetMetadataOptions = {
  uuid: string
}

export type GetMetadataResponse = Metadata

export async function getMetadata(
  options: GetMetadataOptions,
  userSettings: ApiRequestSettings
): Promise<GetMetadataResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/files/${options.uuid}/metadata/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200], camelize: false })
}
