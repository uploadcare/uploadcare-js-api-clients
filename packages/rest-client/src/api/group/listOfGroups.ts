import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { GroupInfoShort } from '../../types/GroupInfo'
import { PaginatedList } from '../../types/PaginatedList'
import { handleApiRequest } from '../handleApiRequest'

export type ListOfGroupsOrdering = 'datetime_created' | '-datetime_created'

export type ListOfGroupsOptions = {
  from?: Date
  limit?: number
  ordering?: ListOfGroupsOrdering
}

export type ListOfGroupsResponse = PaginatedList<GroupInfoShort>

export async function listOfGroups(
  options: ListOfGroupsOptions,
  userSettings: ApiRequestSettings
): Promise<ListOfGroupsResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: '/groups/',
      query: {
        from: options.from,
        limit: options.limit,
        ordering: options.ordering
      }
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
