export type PaginatedList<PageItem, PageExtra = Record<string, never>> = {
  next: string | null
  previous: string | null
  total: number
  perPage: number
  results: PageItem[]
} & PageExtra
