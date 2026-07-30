import { LEGACY_CDN_BASE } from '../cdn-base'
import { trimTrailingSlashes } from '../grammar'
import { parseCdnUrl } from '../parse'
import type { ParsedCdnUrl } from '../types'
import {
  DocumentChain,
  FileChain,
  Gif2VideoChain,
  GroupChain,
  GroupElementChain,
  type GroupInput,
  ProxyChain,
  toGroupId,
  VideoChain
} from './chains'

/** Any chain `cdn.parse` can return, discriminated by `kind`. */
export type ParsedChain =
  | FileChain
  | GroupChain
  | GroupElementChain
  | ProxyChain

/**
 * The fluent entry object, as returned by {@link base}. Every member is
 * `readonly` and the object itself is frozen, so a consumer cannot monkey-patch
 * a shared entry point; `base` returns a new one instead.
 */
export interface Cdn {
  /** Starts a single-file chain. */
  readonly file: (uuid: string) => FileChain
  /** Parses any CDN url into the matching chain — see {@link parse}. */
  readonly parse: (url: string) => ParsedChain
  /** Starts a group root chain from a `uuid~count` id or parsed id. */
  readonly group: (id: GroupInput) => GroupChain
  /** Starts a delivery-proxy chain over a remote source url. */
  readonly proxy: (endpoint: string, sourceUrl: string) => ProxyChain
  /** Starts a video conversion path chain (REST convert API). */
  readonly video: (uuid: string) => VideoChain
  /** Starts a document conversion path chain (REST convert API). */
  readonly document: (uuid: string) => DocumentChain
  /** Starts an on-the-fly gif2video url chain. */
  readonly gif2video: (uuid: string) => Gif2VideoChain
  /** Returns a new {@link Cdn} bound to a different CDN base — see {@link base}. */
  readonly base: (cdnBase: string) => Cdn
}

/**
 * Parses any CDN url into the matching chain (narrow by `.kind`). Config-free:
 * the cdnBase comes from the url, so this needs no {@link base} call.
 *
 * @example
 * ```ts
 * const chain = parse('https://ucarecdn.com/:uuid/-/crop/640x480/photo.jpg')
 * if (chain.kind === 'file') chain.preview(400, 400).href
 * ```
 */
export function parse(url: string): ParsedChain {
  return wrapParsed(parseCdnUrl(url))
}

function wrapParsed(parsed: ParsedCdnUrl): ParsedChain {
  switch (parsed.kind) {
    case 'file':
      return new FileChain({
        cdnBase: parsed.cdnBase,
        uuid: parsed.uuid,
        operations: parsed.operations,
        filename: parsed.filename,
        search: parsed.search,
        hash: parsed.hash
      })
    case 'group':
      return new GroupChain({
        cdnBase: parsed.cdnBase,
        group: parsed.group,
        search: parsed.search,
        hash: parsed.hash
      })
    case 'group-element':
      return new GroupElementChain({
        cdnBase: parsed.cdnBase,
        group: parsed.group,
        nth: parsed.nth,
        operations: parsed.operations,
        filename: parsed.filename,
        search: parsed.search,
        hash: parsed.hash
      })
    case 'proxy':
      return new ProxyChain({
        cdnBase: parsed.cdnBase,
        operations: parsed.operations,
        sourceUrl: parsed.sourceUrl
      })
    default: {
      const exhaustive: never = parsed
      throw new TypeError(`Unsupported CDN URL kind: ${String(exhaustive)}`)
    }
  }
}

/**
 * Creates the fluent entry object, bound to the CDN base your project delivers
 * from: its prefixed host (see {@link prefixedCdnBase}), your own CNAME, or
 * {@link LEGACY_CDN_BASE}. Trailing slash tolerated.
 *
 * This is the only way in — no zero-config entry object exists, because no
 * single host works for every project.
 *
 * @example
 * ```ts
 * // your project's own prefixed host, derived from its public key
 * const cdn = base(prefixedCdnBase('demopublickey'))
 * cdn.file(uuid).preview(800, 600).href
 *
 * // or your own CNAME
 * base('https://cdn.example.com').file(uuid).href
 * ```
 */
export function base(cdnBase: string): Cdn {
  if (__DEV__ && !cdnBase) {
    throw new TypeError(
      'base(): a CDN base is required — pass your prefixed host (see prefixedCdnBase), your CNAME, or LEGACY_CDN_BASE'
    )
  }

  // The fallback is for JS callers only, and it is the legacy shared base:
  // never a bare `ucarecd.net`, which does not resolve without a project prefix
  // on it.
  const resolved = cdnBase || LEGACY_CDN_BASE

  const api: Cdn = {
    file: (uuid) =>
      new FileChain({
        cdnBase: resolved,
        uuid,
        operations: [],
        filename: null,
        search: '',
        hash: ''
      }),
    parse,
    group: (id) =>
      new GroupChain({
        cdnBase: resolved,
        group: toGroupId(id),
        search: '',
        hash: ''
      }),
    proxy: (endpoint, sourceUrl) =>
      new ProxyChain({
        cdnBase: trimTrailingSlashes(endpoint),
        operations: [],
        sourceUrl
      }),
    video: (uuid) => new VideoChain({ uuid, operations: [] }),
    document: (uuid) => new DocumentChain({ uuid, operations: [] }),
    gif2video: (uuid) =>
      new Gif2VideoChain({ cdnBase: resolved, uuid, operations: [] }),
    base
  }

  return Object.freeze(api)
}
