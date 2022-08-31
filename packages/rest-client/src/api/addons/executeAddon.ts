import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { AddonName } from '../../types/AddonName'
import { AddonParams } from '../../types/AddonParams'
import { handleApiRequest } from '../handleApiRequest'

export type ExecuteAddonOptions<T extends AddonName> = {
  addonName: T
  target: string
  params?: AddonParams[T]
}

export type ExecuteAddonResponse = {
  requestId: string
}

export async function executeAddon<T extends AddonName = AddonName>(
  options: ExecuteAddonOptions<T>,
  userSettings: ApiRequestSettings
): Promise<ExecuteAddonResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'POST',
      path: `/addons/${options.addonName}/execute/`,
      body: {
        target: options.target,
        params: options.params
      }
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
