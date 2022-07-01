import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { AddonName } from '../../types/AddonName'
import { handleApiRequest } from '../handleApiRequest'

export type AddonExecutionStatusOptions = {
  addonName: AddonName
  requestId: string
}

export type AddonExecutionStatusResponse = {
  requestId: string
}

export async function addonExecutionStatus(
  options: AddonExecutionStatusOptions,
  userSettings: ApiRequestSettings
): Promise<AddonExecutionStatusResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/POST/${options.addonName}/execute/status/`,
      query: {
        request_id: options.requestId
      }
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
