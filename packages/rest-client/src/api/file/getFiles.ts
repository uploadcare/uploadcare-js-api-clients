import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { ServerErrorResponse } from '../../ServerErrorResponse'
import { RestClientError } from '../../tools/RestClientError'

export type GetFilesOrdering = 'datetime_uploaded' | '-datetime_uploaded'

export type GetFilesOptions = {
  from?: Date
  removed?: boolean
  stored?: boolean
  limit?: number
  ordering?: GetFilesOrdering
}

export type PaginatedResponse<R, T> = {
  next: string
  previous: string
  total: number
  perPage: number
  results: R[]
  totals: T
}

export type FileInfo = unknown
export type GetFilesTotals = {
  removed: number
  stored: number
  unstored: number
}

export type GetFilesResponse = PaginatedResponse<FileInfo, GetFilesTotals>

export function getFiles(
  options: GetFilesOptions,
  userSettings: ApiRequestSettings
): Promise<GetFilesResponse> {
  return apiRequest(
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
  ).then(async (response) => {
    const json = (await response.json()) as unknown

    if (response.status !== 200) {
      throw new RestClientError((json as ServerErrorResponse).detail)
    }

    return json as GetFilesResponse
  })
}
