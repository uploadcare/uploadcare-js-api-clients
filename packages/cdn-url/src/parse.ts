import { GROUP_ID_RE, UUID_RE } from './grammar'
import type { CdnOperation, ConversionKind, ParsedCdnUrl } from './types'

const CONVERSIONS: readonly ConversionKind[] = [
  'video',
  'document',
  'gif2video'
]
const EMBEDDED_URL_RE = /\/(https?:\/\/.+)$/i

/** Narrows a path segment to a conversion prefix. */
function isConversion(segment: string | undefined): segment is ConversionKind {
  return segment != null && (CONVERSIONS as readonly string[]).includes(segment)
}

/**
 * Parses any Uploadcare CDN URL — file, group, group element, conversion
 * result or proxified remote source — into a {@link ParsedCdnUrl}
 * discriminated by `kind`.
 *
 * Parsing is lenient about operations: unknown directives (including internal
 * `@`-prefixed ones) are preserved verbatim, so
 * `serializeCdnUrl(parseCdnUrl(url)) === url`.
 *
 * @throws TypeError when the URL cannot be interpreted as a CDN URL.
 * @see https://uploadcare.com/docs/cdn-operations/
 * @example
 * ```ts
 * parseCdnUrl('https://ucarecdn.com/:uuid/-/resize/300x/photo.jpg')
 * // → { kind: 'file', uuid: ':uuid', operations: [{ name: 'resize', params: ['300x'] }], filename: 'photo.jpg', ... }
 * ```
 */
export function parseCdnUrl(url: string): ParsedCdnUrl {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new TypeError(`Invalid URL: "${url}"`)
  }

  const origin = `${parsed.protocol}//${parsed.host}`
  const pathname = parsed.pathname

  // Proxy: operations (if any) followed by an embedded absolute source URL.
  // The query/hash belong to the source, not to the CDN URL itself.
  const embeddedSource = pathname.match(EMBEDDED_URL_RE)?.[1]
  if (embeddedSource !== undefined) {
    const prefix = pathname.slice(0, pathname.length - embeddedSource.length)
    return {
      kind: 'proxy',
      origin,
      operations: parseOperationSegments(segmentize(prefix), 'proxy prefix'),
      sourceUrl: embeddedSource + parsed.search + parsed.hash
    }
  }

  const hasTrailingSlash = pathname.endsWith('/')
  const segments = segmentize(pathname)
  const head = segments.shift()
  if (head === undefined) {
    throw new TypeError(`Not a CDN URL (empty path): "${url}"`)
  }
  const common = { origin, search: parsed.search, hash: parsed.hash }

  const groupMatch = head.match(GROUP_ID_RE)
  if (groupMatch?.[1] !== undefined) {
    const group = {
      uuid: groupMatch[1],
      count: Number(groupMatch[2])
    }
    if (segments[0] === 'nth') {
      const index = Number(segments[1])
      if (!Number.isInteger(index)) {
        throw new TypeError(`Invalid group element index in "${url}"`)
      }
      segments.splice(0, 2)
      const filename = takeFilename(segments, hasTrailingSlash)
      return {
        kind: 'group-element',
        ...common,
        group,
        nth: index,
        operations: parseOperationSegments(segments, url),
        filename
      }
    }
    if (segments.length > 0) {
      throw new TypeError(`Unexpected path after group id in "${url}"`)
    }
    return { kind: 'group', ...common, group }
  }

  if (!UUID_RE.test(head)) {
    throw new TypeError(
      `Not a CDN URL (no uuid, group or proxy source): "${url}"`
    )
  }

  let conversion: ConversionKind | null = null
  if (isConversion(segments[0])) {
    conversion = segments[0]
    segments.shift()
  }

  const filename = takeFilename(segments, hasTrailingSlash)
  return {
    kind: 'file',
    ...common,
    uuid: head,
    conversion,
    operations: parseOperationSegments(segments, url),
    filename
  }
}

/**
 * Parses a bare modifiers string (e.g. the `cdnUrlModifiers` value stored
 * alongside a uuid) into operations. Lenient like {@link parseCdnUrl};
 * round-trips with `serializeOperations`.
 *
 * @throws TypeError when the string is not an operation chain.
 * @see https://uploadcare.com/docs/cdn-operations/
 * @example
 * ```ts
 * parseOperations('-/crop/640x480/center/-/preview/')
 * // → [{ name: 'crop', params: ['640x480', 'center'] }, { name: 'preview', params: [] }]
 * ```
 */
export function parseOperations(modifiers: string): CdnOperation[] {
  return parseOperationSegments(segmentize(modifiers), modifiers)
}

function segmentize(pathname: string): string[] {
  return pathname.split('/').filter((s) => s !== '')
}

/** The last path segment is a filename iff the path has no trailing slash. */
function takeFilename(
  segments: string[],
  hasTrailingSlash: boolean
): string | null {
  if (hasTrailingSlash || segments.length === 0) return null
  return segments.pop() ?? null
}

/** Consumes `-`, name, params… groups; throws on segments outside an op chain. */
function parseOperationSegments(
  segments: string[],
  source: string
): CdnOperation[] {
  const operations: CdnOperation[] = []
  let i = 0
  while (i < segments.length) {
    if (segments[i] !== '-') {
      throw new TypeError(
        `Unexpected path segment "${segments[i]}" in "${source}"`
      )
    }
    i += 1
    const name = segments[i]
    if (name == null || name === '-') {
      throw new TypeError(`Missing operation name in "${source}"`)
    }
    i += 1
    const params: string[] = []
    while (i < segments.length) {
      const param = segments[i]
      if (param === undefined || param === '-') break
      params.push(param)
      i += 1
    }
    operations.push({ name, params })
  }
  return operations
}
