import { trimTrailingSlashes } from './grammar'
import { isFileInput, isGroupInput, isProxyInput } from './input-kind'
import type {
  CdnOperation,
  CdnUrlInput,
  FileUrlInput,
  GroupUrlInput,
  ProxyUrlInput
} from './types'

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
 * serializeCdnUrl({ cdnBase: 'https://ucarecdn.com', uuid, operations: [preview(800, 600)] })
 * // → https://ucarecdn.com/:uuid/-/preview/800x600/
 * ```
 */
export function serializeCdnUrl(input: CdnUrlInput): string {
  if (isProxyInput(input)) return serializeProxyUrl(input)
  if (isGroupInput(input)) return serializeGroupUrl(input)
  if (isFileInput(input)) return serializeFileUrl(input)
  throw new TypeError('serializeCdnUrl requires one of: uuid, group, sourceUrl')
}

/**
 * Builds a url for a single stored file — the write-side counterpart of
 * {@link parseFileUrl}.
 *
 * Exists for the same reason the per-kind parsers do: a caller that only ever
 * builds file urls should not carry the group and proxy branches. Import this
 * instead of {@link serializeCdnUrl} and they tree-shake away.
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 * @example
 * ```ts
 * serializeFileUrl({ cdnBase: 'https://ucarecdn.com', uuid, operations: [preview(800, 600)] })
 * // → https://ucarecdn.com/:uuid/-/preview/800x600/
 * ```
 */
export function serializeFileUrl(input: FileUrlInput): string {
  const cdnBase = trimTrailingSlashes(input.cdnBase)
  const conversion = input.conversion != null ? `${input.conversion}/` : ''
  const ops = serializeOperations(input.operations ?? [])
  const tail = `${input.filename ?? ''}${input.search ?? ''}${input.hash ?? ''}`
  return `${cdnBase}/${input.uuid}/${conversion}${ops}${tail}`
}

/**
 * Builds a group root url, or a group element url when `nth` is given — the
 * write-side counterpart of {@link parseGroupUrl} and {@link parseGroupElementUrl}.
 *
 * One function rather than two because both come from a single `GroupUrlInput`:
 * a group root is the same url without an element index. Group roots address the
 * whole group, so `operations` and `filename` apply only with `nth`.
 *
 * @see https://uploadcare.com/docs/file-groups/
 * @example
 * ```ts
 * serializeGroupUrl({ cdnBase: 'https://ucarecdn.com', group: { uuid, count: 3 } })
 * // → https://ucarecdn.com/:uuid~3/
 * ```
 */
export function serializeGroupUrl(input: GroupUrlInput): string {
  const cdnBase = trimTrailingSlashes(input.cdnBase)
  let path = `${cdnBase}/${input.group.uuid}~${input.group.count}/`
  if (input.nth != null) {
    const ops = serializeOperations(input.operations ?? [])
    path += `nth/${input.nth}/${ops}${input.filename ?? ''}`
  }
  return path + (input.search ?? '') + (input.hash ?? '')
}

/**
 * Builds a delivery proxy url for a remote source — the write-side counterpart of
 * {@link parseProxyUrl}. The source url is embedded verbatim and trails the
 * operations, so it carries its own query string.
 *
 * @see https://uploadcare.com/docs/delivery/proxy/
 * @example
 * ```ts
 * serializeProxyUrl({ cdnBase: 'https://pubkey.ucr.io', sourceUrl: 'https://example.com/a.jpg' })
 * // → https://pubkey.ucr.io/https://example.com/a.jpg
 * ```
 */
export function serializeProxyUrl(input: ProxyUrlInput): string {
  const cdnBase = trimTrailingSlashes(input.cdnBase)
  return `${cdnBase}/${serializeOperations(input.operations ?? [])}${input.sourceUrl}`
}
