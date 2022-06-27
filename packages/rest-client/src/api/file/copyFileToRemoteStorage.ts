import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { CopyResponse } from '../../types/CopyResponse'
import { handleResponse } from '../handleResponse'

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

  return handleResponse({ response, okCodes: [200, 201] })
}
