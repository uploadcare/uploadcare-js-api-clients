import { apiRequest } from '../../apiRequest'
import { Settings, defaultSettings } from '../../settings'

type Ordering = 'datetime_uploaded' | '-datetime_uploaded'

type GetFiles = {
  from: Date
  removed?: boolean
  stored?: boolean
  limit?: number
  ordering?: Ordering
}

export function getFiles(options: GetFiles, settings: Settings) {
  return apiRequest({
    method: 'GET',
    path: '/files/',
    query: {
      from: options.from,
      removed: options.removed,
      stored: options.stored,
      limit: options.limit,
      ordering: options.ordering
    },
    settings: {
      ...defaultSettings,
      settings
    } as Required<Settings>
  })
}
