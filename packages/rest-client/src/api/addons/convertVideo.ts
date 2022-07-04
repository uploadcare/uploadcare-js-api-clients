import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { Problems } from '../../types/Problems'
import { handleApiRequest } from '../handleApiRequest'
import { StoreValue } from '../../types/StoreValue'

export type ConvertVideoOptions = {
  paths: string[]
  store?: StoreValue
}

export type ConvertVideoResponse = {
  problems: Problems
  result: {
    originalSource: string
    uuid: string
    token: number
    thumbnailsGroupUuid: string
  }[]
}

/**
 * @group Addons API
 */
export async function convertVideo(
  options: ConvertVideoOptions,
  userSettings: ApiRequestSettings
): Promise<ConvertVideoResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'POST',
      path: `/convert/video/`,
      body: {
        paths: options.paths,
        store: options.store
      }
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
