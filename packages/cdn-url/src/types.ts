/**
 * A single CDN URL directive: `-/name/param1/param2/`.
 *
 * @see https://uploadcare.com/docs/cdn-operations/
 */
export interface CdnOperation {
  /** Operation name, e.g. `preview`, `scale_crop`, `@clib`. */
  name: string
  /** Positional parameters, already serialized to their URL form. */
  params: string[]
}

/**
 * File group id: `uuid~count`.
 *
 * @see https://uploadcare.com/docs/file-groups/
 */
export interface GroupId {
  /** UUID part of the group id (without the `~N` suffix). */
  uuid: string
  /** Number of files in the group (the `~N` suffix). */
  count: number
}

/**
 * Conversion path prefixes that attach directly after the uuid with a plain
 * `/` (no `-/` separator): `/:uuid/video/...`, `/:uuid/document/...`,
 * `/:uuid/gif2video/...`.
 */
export type ConversionKind = 'video' | 'document' | 'gif2video'

/** Discriminant of {@link ParsedCdnUrl}. */
export type CdnUrlKind = 'file' | 'group' | 'group-element' | 'proxy'

interface CdnUrlShapeBase {
  /** Scheme + host, no trailing slash, e.g. `https://ucarecdn.com`. */
  origin: string
  /** Preserved query string (incl. secure tokens), `''` or `?...`. */
  search: string
  /** Preserved fragment, `''` or `#...`. */
  hash: string
}

/**
 * A single-file CDN URL: `/:uuid/(:conversion/)(-/op/.../)(:filename)`.
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 */
export interface ParsedFileUrl extends CdnUrlShapeBase {
  /** Discriminant: a single-file url. */
  kind: 'file'
  /** File UUID. */
  uuid: string
  /** Conversion path prefix, when the url addresses a conversion result. */
  conversion: ConversionKind | null
  /** Transformation directives, in order. */
  operations: CdnOperation[]
  /** Trailing filename, or null when the url ends with a slash. */
  filename: string | null
}

/**
 * A group root URL: `/:uuid~N/`. Group roots cannot carry operations or a
 * filename — process individual files via {@link ParsedGroupElementUrl}.
 *
 * @see https://uploadcare.com/docs/file-groups/
 */
export interface ParsedGroupUrl extends CdnUrlShapeBase {
  /** Discriminant: a group root url. */
  kind: 'group'
  /** Parsed group id. */
  group: GroupId
}

/**
 * A group element URL: `/:uuid~N/nth/i/(-/op/.../)(:filename)`.
 *
 * @see https://uploadcare.com/docs/file-groups/#group-cdn
 */
export interface ParsedGroupElementUrl extends CdnUrlShapeBase {
  /** Discriminant: a single file addressed inside a group. */
  kind: 'group-element'
  /** Parsed group id. */
  group: GroupId
  /** Zero-based element index. */
  nth: number
  /** Transformation directives applied to the element, in order. */
  operations: CdnOperation[]
  /** Trailing filename, or null when the url ends with a slash. */
  filename: string | null
}

/**
 * A delivery proxy URL: `/(-/op/.../):sourceUrl`. The embedded source keeps
 * its own query string and fragment, so the shape has no `search`/`hash`.
 *
 * @see https://uploadcare.com/docs/delivery/proxy/
 */
export interface ParsedProxyUrl {
  /** Discriminant: a delivery proxy url with an embedded source. */
  kind: 'proxy'
  /** Proxy endpoint origin, e.g. `https://pubkey.ucr.io`. */
  origin: string
  /** Transformation directives applied before fetching the source, in order. */
  operations: CdnOperation[]
  /** The embedded remote source url, verbatim. */
  sourceUrl: string
}

/**
 * A CDN URL decomposed into a plain serializable shape, discriminated by
 * {@link CdnUrlKind}. Produced by `parseCdnUrl`, consumed by
 * `serializeCdnUrl`.
 */
export type ParsedCdnUrl =
  | ParsedFileUrl
  | ParsedGroupUrl
  | ParsedGroupElementUrl
  | ParsedProxyUrl

/** Input shape for building a file url with `serializeCdnUrl`. */
export interface FileUrlInput {
  /** Scheme + host, e.g. `https://ucarecdn.com` (trailing slash tolerated). */
  origin: string
  /** File UUID. */
  uuid: string
  /** Conversion path prefix (`video`, `document`, `gif2video`), if any. */
  conversion?: ConversionKind | null
  /** Transformation directives, in order (default none). */
  operations?: CdnOperation[]
  /** Trailing filename (default none). */
  filename?: string | null
  /** Query string to append, `'?...'` (default none). */
  search?: string
  /** Fragment to append, `'#...'` (default none). */
  hash?: string
}

/** Input shape for building a group root or group element url. */
export interface GroupUrlInput {
  /** Scheme + host, e.g. `https://ucarecdn.com` (trailing slash tolerated). */
  origin: string
  /** Group id to address. */
  group: GroupId
  /** Zero-based element index; omit for the group root url. */
  nth?: number | null
  /** Transformation directives for the element (group roots cannot carry any). */
  operations?: CdnOperation[]
  /** Trailing filename for the element (default none). */
  filename?: string | null
  /** Query string to append, `'?...'` (default none). */
  search?: string
  /** Fragment to append, `'#...'` (default none). */
  hash?: string
}

/** Input shape for building a delivery proxy url. */
export interface ProxyUrlInput {
  /** Proxy endpoint origin, e.g. `https://pubkey.ucr.io`. */
  origin: string
  /** Remote source url to embed, verbatim (query string included). */
  sourceUrl: string
  /** Transformation directives applied before the source (default none). */
  operations?: CdnOperation[]
}

/**
 * Input for `serializeCdnUrl` — discriminated by which addressing field is
 * present (`uuid`, `group` or `sourceUrl`). Every {@link ParsedCdnUrl} is a
 * valid input, which is what makes parse → edit → serialize round-trips work.
 */
export type CdnUrlInput = FileUrlInput | GroupUrlInput | ProxyUrlInput

/**
 * CDN domain classification.
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 */
export type DomainKind = 'legacy' | 'prefixed' | 'proxy' | 'custom'
