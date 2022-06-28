import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { FileInfo } from '../../types/FileInfo'
import { PaginatedList } from '../../types/PaginatedList'
import { handleResponse } from '../handleResponse'

export type ListOfFilesOrdering = 'datetime_uploaded' | '-datetime_uploaded'

export type ListOfFilesOptions = {
  from?: Date
  removed?: boolean
  stored?: boolean
  limit?: number
  ordering?: ListOfFilesOrdering
}

export type ListOfFilesTotals = {
  removed: number
  stored: number
  unstored: number
}

export type ListOfFilesResponse = PaginatedList<FileInfo> & {
  totals: ListOfFilesTotals
}

export async function listOfFiles(
  options: ListOfFilesOptions,
  userSettings: ApiRequestSettings
): Promise<ListOfFilesResponse> {
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
  return handleResponse({ response, okCodes: [200] })
}
