import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { FileInfo } from '../../types/FileInfo'
import { handleResponse } from '../handleResponse'

export type FileInfoOptions = {
  uuid: string
  include?: string
}

export type FileInfoResponse = FileInfo

export async function fileInfo(
  options: FileInfoOptions,
  userSettings: ApiRequestSettings
): Promise<FileInfoResponse> {
  const response = await apiRequest(
    {
      method: 'GET',
      path: `/files/${options.uuid}/`,
      query: {
        include: options.include
      }
    },
    userSettings
  )

  return handleResponse({ response, okCodes: [200] })
}
