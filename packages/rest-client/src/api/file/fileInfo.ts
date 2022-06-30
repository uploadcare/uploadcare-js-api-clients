import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { FileInfo } from '../../types/FileInfo'
import { handleResponse } from '../handleResponse'

export type InfoOptions = {
  uuid: string
  include?: string
}

export type InfoResponse = FileInfo

export async function fileInfo(
  options: InfoOptions,
  userSettings: ApiRequestSettings
): Promise<InfoResponse> {
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
