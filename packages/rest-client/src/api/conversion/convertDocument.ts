import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { ConversionOptions } from '../../types/ConversionOptions'
import { ConversionResponse } from '../../types/ConversionResponse'
import { ConversionResult } from '../../types/ConversionResult'
import { handleApiRequest } from '../handleApiRequest'

export type ConvertDocumentOptions = ConversionOptions
export type ConvertDocumentResult = ConversionResult
export type ConvertDocumentResponse = ConversionResponse<ConvertDocumentResult>

export async function convertDocument(
  options: ConvertDocumentOptions,
  userSettings: ApiRequestSettings
): Promise<ConvertDocumentResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'POST',
      path: `/convert/document/`,
      body: {
        paths: options.paths,
        store: options.store
      }
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
