import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { GroupInfo } from '../../types/GroupInfo'
import { handleResponse } from '../handleResponse'

export type GroupInfoOptions = {
  uuid: string
}

export type GroupInfoResponse = GroupInfo

export async function groupInfo(
  options: GroupInfoOptions,
  userSettings: ApiRequestSettings
): Promise<GroupInfoResponse> {
  const response = await apiRequest(
    {
      method: 'GET',
      path: `/groups/${options.uuid}/`
    },
    userSettings
  )

  return handleResponse({ response, okCodes: [200] })
}
