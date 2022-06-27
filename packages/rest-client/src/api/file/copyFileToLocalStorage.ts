import { Metadata } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { CopyResponse } from '../../types/CopyResponse'
import { FileInfo } from '../../types/FileInfo'
import { handleResponse } from '../handleResponse'

export type CopyFileToLocalStorageOptions = {
  source: string
  store?: boolean
  metadata?: Metadata
}

/**
 * There is a bug in the API. FileInfo will be incomplete.
 * It's better to refetch fileInfo after request in the high-level wrappers.
 */
export type CopyFileToLocalStorageResponse = CopyResponse<'file', FileInfo>

export async function copyFileToLocalStorage(
  options: CopyFileToLocalStorageOptions,
  userSettings: ApiRequestSettings
): Promise<CopyFileToLocalStorageResponse> {
  const response = await apiRequest(
    {
      method: 'POST',
      path: `/files/local_copy/`,
      body: {
        source: options.source,
        store: options.store,
        metadata: options.metadata
      }
    },
    userSettings
  )

  return handleResponse({ response, okCodes: [201] })
}
