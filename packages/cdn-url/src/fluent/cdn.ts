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
 * What the `cdn` object offers before a CDN base is bound: the starters that do
 * not need one. Conversion chains emit a path with no host by design, a proxy
 * chain takes its endpoint as an argument, and a parsed url carries its own base.
 *
 * `file`, `group` and `gif2video` are absent on purpose — they cannot produce a
 * url without a host, so reaching for one here is a compile error. Call
 * {@link UnboundCdn.base} first; it hands back a {@link Cdn} with the full
 * surface.
 */
export interface UnboundCdn {
  /**
   * Binds the host to deliver from and returns the full entry object. The
   * receiver is untouched — every object here is frozen.
   *
   * @example
   * ```ts
   * const my = cdn.base(prefixedCdnBase('demopublickey'))
   * my.file(uuid).preview(800, 600).href
   * ```
   */
  readonly base: (cdnBase: string) => Cdn
  /** Parses any CDN url into the matching chain — see {@link parse}. */
  readonly parse: (url: string) => ParsedChain
  /** Starts a delivery-proxy chain; the endpoint is this call's argument, not the bound base. */
  readonly proxy: (endpoint: string, sourceUrl: string) => ProxyChain
  /** Starts a video conversion path chain (REST convert API) — a path, so no host is involved. */
  readonly video: (uuid: string) => VideoChain
  /** Starts a document conversion path chain (REST convert API) — a path, so no host is involved. */
  readonly document: (uuid: string) => DocumentChain
}

/**
 * The fluent entry object with a CDN base bound, as returned by
 * {@link UnboundCdn.base}. Every member is `readonly` and the object is
 * frozen, so a shared entry point cannot be monkey-patched.
 *
 * `base` remains available and returns another one, so several hosts can
 * coexist in an app.
 */
export interface Cdn extends UnboundCdn {
  /** Starts a single-file chain. */
  readonly file: (uuid: string) => FileChain
  /** Starts a group root chain from a `uuid~count` id or parsed id. */
  readonly group: (id: GroupInput) => GroupChain
  /** Starts an on-the-fly gif2video url chain. */
  readonly gif2video: (uuid: string) => Gif2VideoChain
}

/**
 * Parses any CDN url into the matching chain (narrow by `.kind`). Config-free:
 * the cdnBase comes from the url, so this needs no base bound.
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

/** The base-free starters, identical whether or not a host is bound. */
const baseFree = {
  parse,
  proxy: (endpoint: string, sourceUrl: string): ProxyChain =>
    new ProxyChain({
      cdnBase: trimTrailingSlashes(endpoint),
      operations: [],
      sourceUrl
    }),
  video: (uuid: string): VideoChain => new VideoChain({ uuid, operations: [] }),
  document: (uuid: string): DocumentChain =>
    new DocumentChain({ uuid, operations: [] })
}

function bind(cdnBase: string): Cdn {
  if (__DEV__ && !cdnBase) {
    throw new TypeError(
      'base(): a CDN base is required — pass your prefixed host (see prefixedCdnBase), your CNAME, or LEGACY_CDN_BASE'
    )
  }

  // The fallback is for JS callers only, and it is the legacy shared base: never
  // a bare `ucarecd.net`, which does not resolve without a project prefix on it.
  const resolved = cdnBase || LEGACY_CDN_BASE

  return Object.freeze({
    ...baseFree,
    base: bind,
    file: (uuid: string) =>
      new FileChain({
        cdnBase: resolved,
        uuid,
        operations: [],
        filename: null,
        search: '',
        hash: ''
      }),
    group: (id: GroupInput) =>
      new GroupChain({
        cdnBase: resolved,
        group: toGroupId(id),
        search: '',
        hash: ''
      }),
    gif2video: (uuid: string) =>
      new Gif2VideoChain({ cdnBase: resolved, uuid, operations: [] })
  })
}

/**
 * A starter that cannot work without a host. Absent from {@link UnboundCdn} at
 * the type level, so this only runs for JavaScript callers; it is a structural
 * error rather than a validation one, so it throws in both bundle flavors.
 */
const needsBase = (name: string) => (): never => {
  throw new TypeError(
    `cdn.${name}() needs a CDN base: call cdn.base(…) first, e.g. cdn.base(prefixedCdnBase(publicKey)).${name}(…)`
  )
}

/**
 * The fluent mega-object: every CDN url flavor behind one import, chainable end
 * to end.
 *
 * Bind a host before building anything addressed by one. `file`, `group` and
 * `gif2video` exist only on the object `base` returns, so forgetting is a
 * compile error, not a broken url:
 *
 * ```ts
 * cdn.file(uuid) // ✗ Property 'file' does not exist on type 'UnboundCdn'
 * ```
 *
 * The rest needs no host and works straight off `cdn`: conversion chains emit a
 * path, a proxy chain takes its endpoint as an argument, and `parse` reads the
 * base out of the url it is given.
 *
 * @example
 * ```ts
 * import { cdn } from '@uploadcare/cdn-url/fluent'
 * import { prefixedCdnBase } from '@uploadcare/cdn-url'
 *
 * const my = cdn.base(prefixedCdnBase('demopublickey'))
 * my.file(uuid).preview(800, 600).quality('smart').href
 * my.group(groupId).nth(1).href
 *
 * // no host needed for these
 * cdn.video(uuid).size({ width: 720, height: 540 }).thumbs(5).path
 * cdn.parse(stored).kind
 * ```
 */
export const cdn: UnboundCdn = Object.freeze({
  ...baseFree,
  base: bind,
  file: needsBase('file'),
  group: needsBase('group'),
  gif2video: needsBase('gif2video')
})
