import { trimTrailingSlashes } from '../grammar'
import { serializeOperations } from '../serialize'
import type { CdnOperation } from '../types'

/**
 * Builds a proxified url: operations sit between the endpoint and the
 * embedded source url, whose query string is preserved as-is. The source
 * domain must be allow-listed in the project settings.
 *
 * @see https://uploadcare.com/docs/delivery/proxy/
 * @example
 * ```ts
 * proxyUrl('https://pubkey.ucr.io', 'https://example.com/a.jpg', [preview()])
 * // → https://pubkey.ucr.io/-/preview/https://example.com/a.jpg
 * ```
 */
export function proxyUrl(
  endpoint: string,
  sourceUrl: string,
  operations: CdnOperation[] = []
): string {
  const base = trimTrailingSlashes(endpoint)
  return `${base}/${serializeOperations(operations)}${sourceUrl}`
}
