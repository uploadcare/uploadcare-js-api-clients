import { Tags } from '@uploadcare/api-client-utils'
import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { handleApiRequest } from '../handleApiRequest'

export type GetTagsOptions = {
  uuid: string
}

export type GetTagsResponse = {
  tags: Tags
}

export async function getTags(
  options: GetTagsOptions,
  userSettings: ApiRequestSettings
): Promise<GetTagsResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/files/${options.uuid}/tags/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
