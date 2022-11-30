import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { storeValueToString } from '../../tools/storeValueToString'
import { ConversionOptions } from '../../types/ConversionOptions'
import { ConversionResponse } from '../../types/ConversionResponse'
import { ConversionResult } from '../../types/ConversionResult'
import { handleApiRequest } from '../handleApiRequest'

export type ConvertVideoOptions = ConversionOptions
export interface ConvertVideoResult extends ConversionResult {
  thumbnailsGroupUuid: string
}
export type ConvertVideoResponse = ConversionResponse<ConvertVideoResult>

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
        store: storeValueToString(options.store)
      }
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
