import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { AddonName } from '../../types/AddonName'
import { handleApiRequest } from '../handleApiRequest'

export type ExecuteAddonOptions = {
  addonName: AddonName
}

export type ExecuteAddonResponse = {
  requestId: string
}

export async function executeAddon(
  options: ExecuteAddonOptions,
  userSettings: ApiRequestSettings
): Promise<ExecuteAddonResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'POST',
      path: `/addons/${options.addonName}/execute/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
