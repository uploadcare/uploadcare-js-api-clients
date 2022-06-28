import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { handleResponse } from '../handleResponse'

export type DeleteGroupOptions = {
  uuid: string
}

export type DeleteGroupResponse = void

export async function deleteGroup(
  options: DeleteGroupOptions,
  userSettings: ApiRequestSettings
): Promise<DeleteGroupResponse> {
  const response = await apiRequest(
    {
      method: 'DELETE',
      path: `/groups/${options.uuid}/`
    },
    userSettings
  )

  return handleResponse({ response, okCodes: [204] })
}
