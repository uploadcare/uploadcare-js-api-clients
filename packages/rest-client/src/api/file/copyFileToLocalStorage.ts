import { Metadata } from '@uploadcare/api-client-utils'
import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { FileInfo } from '../../types/FileInfo'
import { handleApiRequest } from '../handleApiRequest'

export type CopyFileToLocalStorageOptions = {
  source: string
  store?: boolean
  metadata?: Metadata
}

/**
 * There is a bug in the API. FileInfo will be incomplete. It's better to
 * refetch fileInfo after request in the high-level wrappers.
 */
export type CopyFileToLocalStorageResponse = {
  type: 'file'
  result: FileInfo
}

export async function copyFileToLocalStorage(
  options: CopyFileToLocalStorageOptions,
  userSettings: ApiRequestSettings
): Promise<CopyFileToLocalStorageResponse> {
  const apiRequest = await makeApiRequest(
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

  return handleApiRequest({ apiRequest, okCodes: [201] })
}
