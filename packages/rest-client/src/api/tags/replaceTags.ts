import { Tags } from '@uploadcare/api-client-utils'
import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { handleApiRequest } from '../handleApiRequest'

export type ReplaceTagsOptions = {
  uuid: string
  tags: Tags
}

export type ReplaceTagsResponse = {
  /** Resulting tag list in storage order */
  tags: Tags
  /** Tags added by this request (sorted alphabetically) */
  added: Tags
  /** Tags removed by this request (sorted alphabetically) */
  deleted: Tags
}

/**
 * Replaces the entire tag set of a file. Previous tags not in the new list are
 * deleted. An empty array clears all tags.
 */
export async function replaceTags(
  options: ReplaceTagsOptions,
  userSettings: ApiRequestSettings
): Promise<ReplaceTagsResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'PUT',
      path: `/files/${options.uuid}/tags/`,
      body: {
        tags: options.tags
      }
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
