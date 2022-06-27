import { camelizeObject } from '@uploadcare/api-client-utils'
import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { ServerErrorResponse } from '../../types/ServerErrorResponse'
import { RestClientError } from '../../tools/RestClientError'
import { FileInfo } from '../../types/FileInfo'
import { PaginatedList } from '../../types/PaginatedList'

export type ListOrdering = 'datetime_uploaded' | '-datetime_uploaded'

export type ListOptions = {
  from?: Date
  removed?: boolean
  stored?: boolean
  limit?: number
  ordering?: ListOrdering
}

export type ListTotals = {
  removed: number
  stored: number
  unstored: number
}

export type ListResponse = PaginatedList<FileInfo> & {
  totals: ListTotals
}

export async function listOfFiles(
  options: ListOptions,
  userSettings: ApiRequestSettings
): Promise<ListResponse> {
  const response = await apiRequest(
    {
      method: 'GET',
      path: '/files/',
      query: {
        from: options.from,
        removed: options.removed,
        stored: options.stored,
        limit: options.limit,
        ordering: options.ordering
      }
    },
    userSettings
  )

  const json = (await response.json()) as Record<string, unknown>

  if (response.status !== 200) {
    throw new RestClientError((json as ServerErrorResponse).detail)
  }

  return camelizeObject(json) as ListResponse
}
