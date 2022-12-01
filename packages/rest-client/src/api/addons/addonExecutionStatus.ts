import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { AddonExecutionStatus } from '../../types/AddonExecutionStatus'
import { AddonName } from '../../types/AddonName'
import { ValueOf } from '../../types/ValueOf'
import { handleApiRequest } from '../handleApiRequest'

export type AddonExecutionStatusOptions<T extends ValueOf<typeof AddonName>> = {
  addonName: T
  requestId: string
}

export type AddonExecutionStatusResponse = {
  status: AddonExecutionStatus
}

export async function addonExecutionStatus<T extends ValueOf<typeof AddonName>>(
  options: AddonExecutionStatusOptions<T>,
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
