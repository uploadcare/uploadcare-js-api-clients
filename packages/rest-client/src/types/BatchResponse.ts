export type BatchResponse<T> = {
  // There is 'ok' only for now
  status: string
  problems: Record<string, string>
  result: T[]
}
