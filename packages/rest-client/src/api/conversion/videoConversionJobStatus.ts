import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { ConversionStatusOptions } from '../../types/ConversionStatusOptions'
import { ConversionStatusResponse } from '../../types/ConversionStatusResponse'
import { ConversionStatusResult } from '../../types/ConversionStatusResult'
import { handleApiRequest } from '../handleApiRequest'

export type VideoConversionJobStatusOptions = ConversionStatusOptions
export type VideoConversionJobStatusResult = ConversionStatusResult & {
  thumbnailsGroupUuid: string
}
export type VideoConversionJobStatusResponse =
  ConversionStatusResponse<VideoConversionJobStatusResult>

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
