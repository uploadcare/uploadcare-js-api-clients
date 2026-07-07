import { conversionPath } from '../conversion-path'
import type { CdnOperation } from '../types'

/**
 * Builds the domain-less conversion path `/:uuid/document/-/.../` to submit
 * to the REST API (`POST /convert/document/`). Not a URL — no domain
 * involved.
 *
 * @throws TypeError on malformed uuids (development bundle only).
 * @see https://uploadcare.com/docs/transformations/document-conversion/
 * @example
 * ```ts
 * documentPath(uuid, [format('jpg'), page(2)])
 * // → /:uuid/document/-/format/jpg/-/page/2/
 * ```
 */
export function documentPath(
  uuid: string,
  operations: CdnOperation[] = []
): string {
  return conversionPath('document', uuid, operations)
}
