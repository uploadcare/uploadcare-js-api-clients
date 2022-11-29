import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { ConversionStatusOptions } from '../../types/ConversionStatusOptions'
import { ConversionStatusResponse } from '../../types/ConversionStatusResponse'
import { ConversionStatusResult } from '../../types/ConversionStatusResult'
import { handleApiRequest } from '../handleApiRequest'

export type DocumentConversionJobStatusOptions = ConversionStatusOptions
export type DocumentConversionJobStatusResult = ConversionStatusResult
export type DocumentConversionJobStatusResponse =
  ConversionStatusResponse<DocumentConversionJobStatusResult>

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
