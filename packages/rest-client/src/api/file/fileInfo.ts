import { camelizeKeys } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { ServerErrorResponse } from '../../types/ServerErrorResponse'
import { RestClientError } from '../../tools/RestClientError'
import { FileInfo } from '../../types/FileInfo'

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

  const json = (await response.json()) as Record<string, unknown>

  if (response.status !== 200) {
    throw new RestClientError((json as ServerErrorResponse).detail)
  }

  return camelizeKeys(json) as InfoResponse
}
