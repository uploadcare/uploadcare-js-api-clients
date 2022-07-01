import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { FileInfo } from '../../types/FileInfo'
import { handleApiRequest } from '../handleApiRequest'

export type FileInfoOptions = {
  uuid: string
  include?: string
}

export type FileInfoResponse = FileInfo

export async function fileInfo(
  options: FileInfoOptions,
  userSettings: ApiRequestSettings
): Promise<FileInfoResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/files/${options.uuid}/`,
      query: {
        include: options.include
      }
    },
    userSettings
  )

  return handleApiRequest({ apiRequest, okCodes: [200] })
}
