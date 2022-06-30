export type PaginatedList<T> = {
  next: string
  previous: string
  total: number
  perPage: number
  results: T[]
}
