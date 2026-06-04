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

/** The default CDN origin used when none is configured. */
export const DEFAULT_ORIGIN = 'https://ucarecdn.com'

/** Options for {@link configure}. */
export interface FluentConfig {
  /** Default origin for all chains, e.g. your CNAME (default `https://ucarecdn.com`). */
  origin?: string
}

/** Any chain `cdn.parse` can return, discriminated by `kind`. */
export type ParsedChain =
  | FileChain
  | GroupChain
  | GroupElementChain
  | ProxyChain

/** The fluent entry object — see {@link cdn}. */
export interface Cdn {
  /** Starts a single-file chain. */
  file(uuid: string): FileChain
  /** Parses any CDN url into the matching chain (narrow by `.kind`). */
  parse(url: string): ParsedChain
  /** Starts a group root chain from a `uuid~count` id or parsed id. */
  group(id: GroupInput): GroupChain
  /** Starts a delivery-proxy chain over a remote source url. */
  proxy(endpoint: string, sourceUrl: string): ProxyChain
  /** Starts a video conversion path chain (REST convert API). */
  video(uuid: string): VideoChain
  /** Starts a document conversion path chain (REST convert API). */
  document(uuid: string): DocumentChain
  /** Starts an on-the-fly gif2video url chain. */
  gif2video(uuid: string): Gif2VideoChain
  /** Returns a new {@link Cdn} with different defaults bound. */
  configure(config: FluentConfig): Cdn
}

function wrapParsed(parsed: ParsedCdnUrl): ParsedChain {
  switch (parsed.kind) {
    case 'file':
      return new FileChain({
        origin: parsed.origin,
        uuid: parsed.uuid,
        operations: parsed.operations,
        filename: parsed.filename,
        search: parsed.search,
        hash: parsed.hash
      })
    case 'group':
      return new GroupChain({
        origin: parsed.origin,
        group: parsed.group,
        search: parsed.search,
        hash: parsed.hash
      })
    case 'group-element':
      return new GroupElementChain({
        origin: parsed.origin,
        group: parsed.group,
        nth: parsed.nth,
        operations: parsed.operations,
        filename: parsed.filename,
        search: parsed.search,
        hash: parsed.hash
      })
    case 'proxy':
      return new ProxyChain({
        origin: parsed.origin,
        operations: parsed.operations,
        sourceUrl: parsed.sourceUrl
      })
  }
}

/**
 * Creates a fluent entry object with the given defaults bound.
 *
 * @example
 * ```ts
 * const myCdn = configure({ origin: 'https://cdn.example.com' })
 * myCdn.file(uuid).preview(800, 600).href
 * ```
 */
export function configure(config: FluentConfig = {}): Cdn {
  const origin = config.origin ?? DEFAULT_ORIGIN

  return {
    file: (uuid) =>
      new FileChain({
        origin,
        uuid,
        operations: [],
        filename: null,
        search: '',
        hash: ''
      }),
    parse: (url) => wrapParsed(parseCdnUrl(url)),
    group: (id) =>
      new GroupChain({ origin, group: toGroupId(id), search: '', hash: '' }),
    proxy: (endpoint, sourceUrl) =>
      new ProxyChain({
        origin: trimTrailingSlashes(endpoint),
        operations: [],
        sourceUrl
      }),
    video: (uuid) => new VideoChain({ uuid, operations: [] }),
    document: (uuid) => new DocumentChain({ uuid, operations: [] }),
    gif2video: (uuid) => new Gif2VideoChain({ origin, uuid, operations: [] }),
    configure: (next) => configure({ origin, ...next })
  }
}

/**
 * The fluent mega-object: every CDN URL flavor behind one import, chainable
 * end to end.
 *
 * @example
 * ```ts
 * import { cdn } from '@uploadcare/cdn-url/fluent'
 *
 * cdn.file(uuid).preview(800, 600).quality('smart').href
 * cdn.parse(stored).kind // narrow, then keep chaining
 * cdn.video(uuid).size({ width: 720, height: 540 }).thumbs(5).path
 * ```
 */
export const cdn: Cdn = configure()
