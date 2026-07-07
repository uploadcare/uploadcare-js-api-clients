import { assertOneOf, trimTrailingSlashes } from '../grammar'
import { serializeCdnUrl } from '../serialize'
import type { CdnOperation, GroupId } from '../types'
import { formatGroupId } from './group-id'

/**
 * Group root url `/:uuid~N/` — lists the files. No `-/` operations are
 * allowed on group roots.
 *
 * @see https://uploadcare.com/docs/file-groups/#group-cdn
 * @example
 * ```ts
 * groupUrl('https://ucarecdn.com', { uuid, count: 3 }) // → https://ucarecdn.com/:uuid~3/
 * ```
 */
export function groupUrl(origin: string, group: GroupId): string {
  return serializeCdnUrl({ origin, group })
}

/**
 * Group element url `/:uuid~N/nth/i/` with optional operations and filename
 * (`i` is zero-based and validated against the group count).
 *
 * @throws RangeError when the index is out of `0..count-1`.
 * @see https://uploadcare.com/docs/file-groups/#group-cdn
 * @example
 * ```ts
 * nthUrl('https://ucarecdn.com', { uuid, count: 3 }, 1) // → https://ucarecdn.com/:uuid~3/nth/1/
 * ```
 */
export function nthUrl(
  origin: string,
  group: GroupId,
  index: number,
  operations: CdnOperation[] = [],
  filename?: string
): string {
  if (
    __DEV__ &&
    (!Number.isInteger(index) || index < 0 || index >= group.count)
  ) {
    throw new RangeError(
      `Group element index ${index} is out of range 0..${group.count - 1}`
    )
  }
  return serializeCdnUrl({
    origin,
    group,
    nth: index,
    operations,
    filename: filename ?? null
  })
}

/** Archive formats accepted by {@link archiveUrl}. */
export const ARCHIVE_FORMATS = ['zip', 'tar'] as const
/** One of the {@link ARCHIVE_FORMATS} values. */
export type ArchiveFormat = (typeof ARCHIVE_FORMATS)[number]

/**
 * Group archive url `/:uuid~N/archive/:format/(:filename)`. Archives contain
 * the original files only (≤ 2 GB uncompressed).
 *
 * @see https://uploadcare.com/docs/file-groups/#group-archive
 * @example
 * ```ts
 * archiveUrl('https://ucarecdn.com', { uuid, count: 3 }, 'zip', 'all.zip')
 * // → https://ucarecdn.com/:uuid~3/archive/zip/all.zip
 * ```
 */
export function archiveUrl(
  origin: string,
  group: GroupId,
  format: ArchiveFormat,
  filename?: string
): string {
  assertOneOf(format, ARCHIVE_FORMATS, 'archive format')
  const base = trimTrailingSlashes(origin)
  return `${base}/${formatGroupId(group)}/archive/${format}/${filename ?? ''}`
}
