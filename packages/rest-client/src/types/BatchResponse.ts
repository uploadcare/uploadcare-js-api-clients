import { Problems } from './Problems'

export enum BatchResponseStatus {
  OK = 'ok'
}

export type BatchResponse<T> = {
  status: BatchResponseStatus
  problems: Problems
  result: T[]
}
