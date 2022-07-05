import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { GroupInfo } from '../../types/GroupInfo'
import { handleApiRequest } from '../handleApiRequest'

export type GroupInfoOptions = {
  uuid: string
}

export type GroupInfoResponse = GroupInfo

export async function groupInfo(
  options: GroupInfoOptions,
  userSettings: ApiRequestSettings
): Promise<GroupInfoResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/groups/${options.uuid}/`
    },
    userSettings
  )

  return handleApiRequest({ apiRequest, okCodes: [200] })
}
