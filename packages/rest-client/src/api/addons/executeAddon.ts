import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { AddonName } from '../../types/AddonName'
import { AddonParams } from '../../types/AddonParams'
import { ValueOf } from '../../types/ValueOf'
import { handleApiRequest } from '../handleApiRequest'

export type ExecuteAddonOptions<T extends ValueOf<typeof AddonName>> = {
  addonName: T
  target: string
  params?: AddonParams[T]
}

export type ExecuteAddonResponse = {
  requestId: string
}

export async function executeAddon<T extends ValueOf<typeof AddonName>>(
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
