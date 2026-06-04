import { UUID_RE } from './grammar'
import { serializeOperations } from './serialize'
import type { CdnOperation, ConversionKind } from './types'

/**
 * Builds a domain-less conversion path `/:uuid/:kind/-/.../` for the REST
 * convert APIs. Shared by `videoPath` and `documentPath`.
 *
 * @internal
 */
export function conversionPath(
  kind: ConversionKind,
  uuid: string,
  operations: CdnOperation[]
): string {
  if (__DEV__ && !UUID_RE.test(uuid)) {
    throw new TypeError(`Invalid uuid: "${uuid}"`)
  }
  return `/${uuid}/${kind}/${serializeOperations(operations)}`
}
