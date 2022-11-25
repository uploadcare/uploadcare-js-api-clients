import { PaginatedList } from './PaginatedList'

export type Paginatable<Options, Settings, PageItem, PageExtra> = (
  options: Options,
  settings: Settings
) => Promise<PaginatedList<PageItem, PageExtra>>
