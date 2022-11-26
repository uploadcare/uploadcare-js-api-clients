import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { FileInfo } from '../../types/FileInfo'
import { PaginatedList } from '../../types/PaginatedList'
import { handleApiRequest } from '../handleApiRequest'

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

export type ListOfFilesResponse = PaginatedList<
  FileInfo,
  {
    totals: ListOfFilesTotals
  }
>

export async function listOfFiles(
  options: ListOfFilesOptions,
  userSettings: ApiRequestSettings
): Promise<ListOfFilesResponse> {
  const apiRequest = await makeApiRequest(
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
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
