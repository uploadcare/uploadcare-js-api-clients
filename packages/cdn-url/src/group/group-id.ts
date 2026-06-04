import { GROUP_ID_RE } from '../grammar'
import type { GroupId } from '../types'

/**
 * Parses a group id of the form `uuid~count`.
 *
 * @throws TypeError on malformed ids.
 * @see https://uploadcare.com/docs/file-groups/
 * @example
 * ```ts
 * parseGroupId(':uuid~11') // → { uuid: ':uuid', count: 11 }
 * ```
 */
export function parseGroupId(id: string): GroupId {
  const match = id.match(GROUP_ID_RE)
  if (!match) {
    throw new TypeError(`Invalid group id: "${id}" (expected "uuid~count")`)
  }
  return { uuid: match[1] as string, count: Number(match[2]) }
}

/**
 * Formats a {@link GroupId} back to its `uuid~count` string form.
 *
 * @see https://uploadcare.com/docs/file-groups/
 * @example
 * ```ts
 * formatGroupId({ uuid: ':uuid', count: 3 }) // → ':uuid~3'
 * ```
 */
export function formatGroupId(group: GroupId): string {
  return `${group.uuid}~${group.count}`
}
