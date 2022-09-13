import { ApiRequestSettings, makeApiRequest } from '../../makeApiRequest'
import { Problems } from '../../types/Problems'
import { handleApiRequest } from '../handleApiRequest'
import { StoreValue } from '../../types/StoreValue'

export type ConvertDocumentOptions = {
  paths: string[]
  store?: StoreValue
}

export type ConvertDocumentResponse = {
  problems: Problems
  result: {
    originalSource: string
    uuid: string
    token: number
  }[]
}

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
