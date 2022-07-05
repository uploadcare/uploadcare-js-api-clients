import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { CopyResponse } from '../../types/CopyResponse'
import { handleApiRequest } from '../handleApiRequest'

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
  const apiRequest = await makeApiRequest(
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

  return handleApiRequest({ apiRequest, okCodes: [200, 201] })
}
