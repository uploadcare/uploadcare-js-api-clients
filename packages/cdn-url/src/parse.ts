import { GROUP_ID_RE, UUID_RE } from './grammar'
import type {
  CdnOperation,
  ConversionKind,
  GroupId,
  ParsedCdnUrl,
  ParsedFileUrl,
  ParsedGroupElementUrl,
  ParsedGroupUrl,
  ParsedProxyUrl
} from './types'

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
 * Splits a URL into the pieces every parser needs. Shared so the per-kind
 * parsers and {@link parseCdnUrl} cannot drift apart.
 */
function splitUrl(url: string): {
  origin: string
  pathname: string
  search: string
  hash: string
  hasTrailingSlash: boolean
} {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new TypeError(`Invalid URL: "${url}"`)
  }
  return {
    origin: `${parsed.protocol}//${parsed.host}`,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    hasTrailingSlash: parsed.pathname.endsWith('/')
  }
}

/** The embedded source of a proxy url, or null when there is none. */
function embeddedSourceOf(pathname: string): string | null {
  return pathname.match(EMBEDDED_URL_RE)?.[1] ?? null
}

/**
 * Parses a delivery proxy URL. Narrower than {@link parseCdnUrl}: importing
 * this alone leaves the file and group parsers out of your bundle.
 *
 * @throws TypeError when the URL carries no embedded source.
 * @see https://uploadcare.com/docs/delivery/proxy/
 * @example
 * ```ts
 * parseProxyUrl('https://pk.ucr.io/-/preview/https://example.com/a.jpg')
 * // → { kind: 'proxy', origin: 'https://pk.ucr.io', operations: [...], sourceUrl: 'https://example.com/a.jpg' }
 * ```
 */
export function parseProxyUrl(url: string): ParsedProxyUrl {
  const { origin, pathname, search, hash } = splitUrl(url)
  const source = embeddedSourceOf(pathname)
  if (source === null) {
    throw new TypeError(`Not a proxy URL (no embedded source): "${url}"`)
  }
  const prefix = pathname.slice(0, pathname.length - source.length)
  return {
    kind: 'proxy',
    origin,
    operations: parseOperationSegments(segmentize(prefix), 'proxy prefix'),
    sourceUrl: source + search + hash
  }
}

/**
 * Parses a group root URL (`/:uuid~N/`). Group roots carry no operations and
 * no filename, which is why the returned shape has neither.
 *
 * @throws TypeError when the URL is not a bare group root.
 * @see https://uploadcare.com/docs/file-groups/
 * @example
 * ```ts
 * parseGroupUrl('https://ucarecdn.com/:uuid~3/')
 * // → { kind: 'group', group: { uuid: ':uuid', count: 3 }, ... }
 * ```
 */
export function parseGroupUrl(url: string): ParsedGroupUrl {
  const { origin, pathname, search, hash } = splitUrl(url)
  if (embeddedSourceOf(pathname) !== null) {
    throw new TypeError(`Not a group URL (proxy source): "${url}"`)
  }
  const segments = segmentize(pathname)
  const head = segments.shift()
  const group = head === undefined ? null : matchGroupId(head)
  if (group === null) {
    throw new TypeError(`Not a group URL (no group id): "${url}"`)
  }
  if (segments.length > 0) {
    throw new TypeError(`Unexpected path after group id in "${url}"`)
  }
  return { kind: 'group', origin, search, hash, group }
}

/**
 * Parses a group element URL (`/:uuid~N/nth/i/`). Narrower than
 * {@link parseCdnUrl}, and distinct from {@link parseGroupUrl}, which handles
 * the group root.
 *
 * @throws TypeError when the URL is not a group element.
 * @see https://uploadcare.com/docs/file-groups/#group-cdn
 * @example
 * ```ts
 * parseGroupElementUrl('https://ucarecdn.com/:uuid~3/nth/1/')
 * // → { kind: 'group-element', nth: 1, group: { uuid: ':uuid', count: 3 }, ... }
 * ```
 */
export function parseGroupElementUrl(url: string): ParsedGroupElementUrl {
  const { origin, pathname, search, hash, hasTrailingSlash } = splitUrl(url)
  if (embeddedSourceOf(pathname) !== null) {
    throw new TypeError(`Not a group element URL (proxy source): "${url}"`)
  }
  const segments = segmentize(pathname)
  const head = segments.shift()
  const group = head === undefined ? null : matchGroupId(head)
  if (group === null) {
    throw new TypeError(`Not a group element URL (no group id): "${url}"`)
  }
  if (segments[0] !== 'nth') {
    throw new TypeError(`Not a group element URL (no nth segment): "${url}"`)
  }
  const index = Number(segments[1])
  if (!Number.isInteger(index)) {
    throw new TypeError(`Invalid group element index in "${url}"`)
  }
  segments.splice(0, 2)
  const filename = takeFilename(segments, hasTrailingSlash)
  return {
    kind: 'group-element',
    origin,
    search,
    hash,
    group,
    nth: index,
    operations: parseOperationSegments(segments, url),
    filename
  }
}

/**
 * Parses a single-file URL, including conversion results. Narrower than
 * {@link parseCdnUrl}: importing this alone keeps the group and proxy parsers
 * out of your bundle, and the result is already narrowed to
 * {@link ParsedFileUrl} without a `kind` check.
 *
 * @throws TypeError when the URL is not a single-file CDN URL.
 * @see https://uploadcare.com/docs/delivery/cdn/
 * @example
 * ```ts
 * parseFileUrl('https://ucarecdn.com/:uuid/-/resize/300x/photo.jpg').uuid
 * // → ':uuid' — no narrowing needed
 * ```
 */
export function parseFileUrl(url: string): ParsedFileUrl {
  const { origin, pathname, search, hash, hasTrailingSlash } = splitUrl(url)
  if (embeddedSourceOf(pathname) !== null) {
    throw new TypeError(`Not a file URL (proxy source): "${url}"`)
  }
  const segments = segmentize(pathname)
  const head = segments.shift()
  if (head === undefined || !UUID_RE.test(head)) {
    throw new TypeError(`Not a file URL (no uuid): "${url}"`)
  }
  let conversion: ConversionKind | null = null
  if (isConversion(segments[0])) {
    conversion = segments[0]
    segments.shift()
  }
  const filename = takeFilename(segments, hasTrailingSlash)
  return {
    kind: 'file',
    origin,
    search,
    hash,
    uuid: head,
    conversion,
    operations: parseOperationSegments(segments, url),
    filename
  }
}

/** Matches a `uuid~count` head segment, or null when it is not one. */
function matchGroupId(head: string): GroupId | null {
  const match = head.match(GROUP_ID_RE)
  if (match?.[1] === undefined) return null
  return { uuid: match[1], count: Number(match[2]) }
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
  const { pathname } = splitUrl(url)

  if (embeddedSourceOf(pathname) !== null) return parseProxyUrl(url)

  const segments = segmentize(pathname)
  const head = segments[0]
  if (head === undefined) {
    throw new TypeError(`Not a CDN URL (empty path): "${url}"`)
  }
  if (matchGroupId(head) !== null) {
    return segments[1] === 'nth'
      ? parseGroupElementUrl(url)
      : parseGroupUrl(url)
  }
  if (!UUID_RE.test(head)) {
    throw new TypeError(
      `Not a CDN URL (no uuid, group or proxy source): "${url}"`
    )
  }
  return parseFileUrl(url)
}

/**
 * Parses a bare modifiers string (e.g. the `cdnUrlModifiers` value stored
 * alongside a uuid) into operations. Lenient like {@link parseCdnUrl};
 * round-trips with `serializeOperations`.
 *
 * Modifiers reach callers in whatever shape their own inputs arrive in — a
 * stored `-/…/` value, a hand-written config string, a DOM attribute — so the
 * leading `-` marker, surrounding slashes and surrounding whitespace are all
 * optional. Operations within a chain are still separated by `-`, which keeps
 * `resize/300x/-/blur/10` unambiguous. Consequently almost any slash-shaped
 * string parses: this does not diagnose a malformed chain, it accepts one.
 *
 * The leniency is deliberately local. Inside a URL a segment that is not `-`
 * is a filename or an error, so {@link parseCdnUrl} and the per-kind parsers
 * stay strict about the marker.
 *
 * @throws TypeError when an operation name is missing (`'-'`, `'-/-/x'`).
 * @see https://uploadcare.com/docs/cdn-operations/
 * @example
 * ```ts
 * parseOperations('-/crop/640x480/center/-/preview/')
 * // → [{ name: 'crop', params: ['640x480', 'center'] }, { name: 'preview', params: [] }]
 *
 * parseOperations('resize/300x') // → [{ name: 'resize', params: ['300x'] }]
 * ```
 */
export function parseOperations(modifiers: string): CdnOperation[] {
  const segments = segmentize(modifiers.trim())
  if (segments.length > 0 && segments[0] !== '-') segments.unshift('-')
  return parseOperationSegments(segments, modifiers)
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

/**
 * Whether a string is a single-file CDN URL, without parsing it or throwing.
 * Pair with {@link parseFileUrl} when the input is untrusted.
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 * @example
 * ```ts
 * isFileUrl('https://ucarecdn.com/:uuid/') // → true
 * isFileUrl('https://ucarecdn.com/:uuid~3/') // → false, that is a group
 * ```
 */
export function isFileUrl(url: string): boolean {
  try {
    parseFileUrl(url)
    return true
  } catch {
    return false
  }
}

/**
 * Whether a string is a group root URL, without parsing it or throwing.
 *
 * @see https://uploadcare.com/docs/file-groups/
 * @example
 * ```ts
 * isGroupUrl('https://ucarecdn.com/:uuid~3/') // → true
 * ```
 */
export function isGroupUrl(url: string): boolean {
  try {
    parseGroupUrl(url)
    return true
  } catch {
    return false
  }
}

/**
 * Whether a string is a group element URL, without parsing it or throwing.
 *
 * @see https://uploadcare.com/docs/file-groups/#group-cdn
 * @example
 * ```ts
 * isGroupElementUrl('https://ucarecdn.com/:uuid~3/nth/1/') // → true
 * ```
 */
export function isGroupElementUrl(url: string): boolean {
  try {
    parseGroupElementUrl(url)
    return true
  } catch {
    return false
  }
}

/**
 * Whether a string is a delivery proxy URL, without parsing it or throwing.
 * Distinct from `isProxyEndpoint`, which only inspects the host.
 *
 * @see https://uploadcare.com/docs/delivery/proxy/
 * @example
 * ```ts
 * isProxyUrl('https://pk.ucr.io/https://example.com/a.jpg') // → true
 * ```
 */
export function isProxyUrl(url: string): boolean {
  try {
    parseProxyUrl(url)
    return true
  } catch {
    return false
  }
}
