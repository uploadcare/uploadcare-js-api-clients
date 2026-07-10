import { Tags } from '@uploadcare/api-client-utils'
import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { handleApiRequest } from '../handleApiRequest'

export type UpdateTagsOptions = {
  uuid: string
  /** Tags to add. Defaults to `[]`. */
  add?: Tags
  /** Tags to remove. Defaults to `[]`. */
  delete?: Tags
}

export type UpdateTagsResponse = {
  /** Resulting tag list in storage order */
  tags: Tags
  /** Tags that were not previously present and were added */
  added: Tags
  /** Tags that were present and were removed */
  deleted: Tags
}

/**
 * Adds and/or removes tags in a single atomic operation. Delete is applied
 * first, then add — so a tag can be removed and re-added in one request.
 */
export async function updateTags(
  options: UpdateTagsOptions,
  userSettings: ApiRequestSettings
): Promise<UpdateTagsResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'PATCH',
      path: `/files/${options.uuid}/tags/`,
      body: {
        add: options.add,
        delete: options.delete
      }
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
