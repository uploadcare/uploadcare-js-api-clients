import type { CdnOperation } from '../types'

/** @internal */
export const createOp = (name: string, ...params: string[]): CdnOperation => ({
  name,
  params
})
