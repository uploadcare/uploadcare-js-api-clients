import { conversionPath } from '../conversion-path'
import type { CdnOperation } from '../types'

/**
 * Builds the domain-less conversion path `/:uuid/video/-/.../` to submit to
 * the REST API (`POST /convert/video/`). Not a URL — no domain involved.
 *
 * @throws TypeError on malformed uuids (development bundle only).
 * @see https://uploadcare.com/docs/transformations/video-encoding/
 * @example
 * ```ts
 * videoPath(uuid, [size({ width: 720, height: 540 })])
 * // → /:uuid/video/-/size/720x540/
 * ```
 */
export function videoPath(
  uuid: string,
  operations: CdnOperation[] = []
): string {
  return conversionPath('video', uuid, operations)
}
