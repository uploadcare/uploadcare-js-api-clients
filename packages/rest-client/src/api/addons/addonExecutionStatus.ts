import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { AddonExecutionStatus } from '../../types/AddonExecutionStatus'
import { AddonName } from '../../types/AddonName'
import { handleApiRequest } from '../handleApiRequest'

export type AddonExecutionStatusOptions = {
  addonName: AddonName
  requestId: string
}

export type AddonExecutionStatusResponse = {
  status: AddonExecutionStatus
}

export async function addonExecutionStatus(
  options: AddonExecutionStatusOptions,
  userSettings: ApiRequestSettings
): Promise<AddonExecutionStatusResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/addons/${options.addonName}/execute/status/`,
      query: {
        request_id: options.requestId
      }
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
