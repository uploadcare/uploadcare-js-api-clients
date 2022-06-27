import { camelizeObject } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { RestClientError } from '../../tools/RestClientError'
import { CopyResponse } from '../../types/CopyResponse'
import { ServerErrorResponse } from '../../types/ServerErrorResponse'

export type CopyFileToRemoteStorageOptions = {
  source: string
  target: string
  makePublic?: boolean
  pattern?: string
}

export type CopyFileToRemoteStorageResponse = CopyResponse<'url', string>

export async function copyFileToRemoteStorage(
  options: CopyFileToRemoteStorageOptions,
  userSettings: ApiRequestSettings
): Promise<CopyFileToRemoteStorageResponse> {
  const response = await apiRequest(
    {
      method: 'POST',
      path: `/files/remote_copy/`,
      body: {
        source: options.source,
        target: options.target,
        make_public: options.makePublic,
        pattern: options.pattern
      }
    },
    userSettings
  )

  const json = (await response.json()) as Record<string, unknown>

  if (![200, 201].includes(response.status)) {
    throw new RestClientError((json as ServerErrorResponse).detail)
  }

  return camelizeObject(json) as CopyFileToRemoteStorageResponse
}
