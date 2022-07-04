import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { ConversionStatus } from '../../types/ConversionStatus'
import { handleApiRequest } from '../handleApiRequest'

export type VideoConversionJobStatusOptions = {
  token: number
}

export type VideoConversionJobStatusResponse = {
  status: ConversionStatus
  error: string | null
  result: {
    uuid: string
  }
}

/**
 * @group Addons API
 */
export async function videoConversionJobStatus(
  options: VideoConversionJobStatusOptions,
  userSettings: ApiRequestSettings
): Promise<VideoConversionJobStatusResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/convert/video/status/${options.token}/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
