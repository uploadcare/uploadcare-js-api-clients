import { camelizeKeys, Metadata } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { ServerErrorResponse } from '../../types/ServerErrorResponse'
import { RestClientError } from '../../tools/RestClientError'
import { FileInfo } from '../../types/FileInfo'
import { CopyResponse } from '../../types/CopyResponse'

export type CopyFileToLocalStorageOptions = {
  source: string
  store?: boolean
  metadata?: Metadata
}

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

  const json = (await response.json()) as Record<string, unknown>

  if (response.status !== 201) {
    throw new RestClientError((json as ServerErrorResponse).detail)
  }

  return camelizeKeys(json) as CopyFileToLocalStorageResponse
}
