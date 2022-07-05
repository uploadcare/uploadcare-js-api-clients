import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { handleApiRequest } from '../handleApiRequest'

export type DeleteGroupOptions = {
  uuid: string
}

export type DeleteGroupResponse = void

export async function deleteGroup(
  options: DeleteGroupOptions,
  userSettings: ApiRequestSettings
): Promise<DeleteGroupResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'DELETE',
      path: `/groups/${options.uuid}/`
    },
    userSettings
  )

  return handleApiRequest({ apiRequest, okCodes: [204] })
}
