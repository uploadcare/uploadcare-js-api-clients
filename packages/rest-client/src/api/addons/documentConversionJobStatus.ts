import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { ConversionStatus } from '../../types/ConversionStatus'
import { handleApiRequest } from '../handleApiRequest'

export type DocumentConversionJobStatusOptions = {
  token: number
}

export type DocumentConversionJobStatusResponse = {
  status: ConversionStatus
  error: string | null
  result: {
    uuid: string
  }
}

export async function documentConversionJobStatus(
  options: DocumentConversionJobStatusOptions,
  userSettings: ApiRequestSettings
): Promise<DocumentConversionJobStatusResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/convert/document/status/${options.token}/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
