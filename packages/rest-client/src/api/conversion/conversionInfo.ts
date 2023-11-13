import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { handleApiRequest } from '../handleApiRequest'

export type ConversionInfoOptions = {
  uuid: string
}

export type ConversionInfoResponse = {
  error: string | null
  format: {
    name: string
    conversionFormats: {
      name: string
    }[]
  }
  convertedGroups: Record<string, string>
}

export async function conversionInfo(
  options: ConversionInfoOptions,
  userSettings: ApiRequestSettings
): Promise<ConversionInfoResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/convert/document/${options.uuid}/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
