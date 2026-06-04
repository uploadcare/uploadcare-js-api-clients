import { trimTrailingSlashes } from './grammar'
import type { CdnOperation, CdnUrlInput } from './types'

/**
 * Serializes operations into the `-/name/params/` directive chain
 * (`''` when the list is empty).
 *
 * @see https://uploadcare.com/docs/cdn-operations/
 * @example
 * ```ts
 * serializeOperations([{ name: 'preview', params: ['100x100'] }]) // → '-/preview/100x100/'
 * ```
 */
export function serializeOperations(
  operations: readonly CdnOperation[]
): string {
  return operations
    .map((op) => `-/${[op.name, ...op.params].join('/')}/`)
    .join('')
}

/**
 * Builds a CDN URL string from a {@link CdnUrlInput}, discriminated by which
 * addressing field is present: `sourceUrl` (proxy), `group` (group root or,
 * with `nth`, a group element) or `uuid` (file). The counterpart of
 * `parseCdnUrl`: `serializeCdnUrl(parseCdnUrl(url)) === url`.
 *
 * @throws TypeError when none of `uuid`, `group` or `sourceUrl` is provided.
 * @see https://uploadcare.com/docs/delivery/cdn/
 * @example
 * ```ts
 * serializeCdnUrl({ origin: 'https://ucarecdn.com', uuid, operations: [preview(800, 600)] })
 * // → https://ucarecdn.com/:uuid/-/preview/800x600/
 * ```
 */
export function serializeCdnUrl(input: CdnUrlInput): string {
  const origin = trimTrailingSlashes(input.origin)
  const ops = serializeOperations(input.operations ?? [])

  if ('sourceUrl' in input && input.sourceUrl != null) {
    return `${origin}/${ops}${input.sourceUrl}`
  }

  const search = ('search' in input ? input.search : '') ?? ''
  const hash = ('hash' in input ? input.hash : '') ?? ''

  if ('group' in input && input.group != null) {
    let path = `${origin}/${input.group.uuid}~${input.group.count}/`
    if (input.nth != null) {
      path += `nth/${input.nth}/${ops}${input.filename ?? ''}`
    }
    return path + search + hash
  }

  if ('uuid' in input && input.uuid != null) {
    const conversion = input.conversion != null ? `${input.conversion}/` : ''
    return `${origin}/${input.uuid}/${conversion}${ops}${input.filename ?? ''}${search}${hash}`
  }

  throw new TypeError('serializeCdnUrl requires one of: uuid, group, sourceUrl')
}
