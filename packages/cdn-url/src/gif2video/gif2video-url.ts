import { serializeCdnUrl } from '../serialize'
import type { CdnOperation } from '../types'

/**
 * Builds an on-the-fly gif2video CDN URL: `/:uuid/gif2video/-/.../`
 * (note: no `-/` between the uuid and the prefix). The source file must be
 * an animated image.
 *
 * @see https://uploadcare.com/docs/transformations/gif-to-video/
 * @example
 * ```ts
 * gif2videoUrl('https://ucarecdn.com', uuid, [format('webm')])
 * // → https://ucarecdn.com/:uuid/gif2video/-/format/webm/
 * ```
 */
export function gif2videoUrl(
  origin: string,
  uuid: string,
  operations: CdnOperation[] = []
): string {
  return serializeCdnUrl({ origin, uuid, conversion: 'gif2video', operations })
}
