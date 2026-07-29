/**
 * The smallest possible read/write pass over a **single-file** CDN url, for
 * callers that only need to swap or append modifiers and cannot spend the bytes
 * on the real parser.
 *
 * It knows nothing: no uuid grammar, no operation objects, no kinds, no
 * validation, no throwing. A url is cut into named strings and joined back
 * together, so `tinyBuild(tinyParse(url)) === url`.
 *
 * The contract is file urls — `/:uuid/-/…/filename`. Groups, group elements and
 * proxy urls are out of scope: the cuts are lexical, so those still round-trip
 * untouched, but their fields come out meaningless (a group element's `nth/N/`
 * and a proxy's embedded source both land in `modifiers`). Use `parseCdnUrl`
 * when the kind is not already known, and `parseFileUrl`/`serializeFileUrl`
 * whenever you need operations as data.
 */
import { trimTrailingSlashes } from '../grammar'
import { asModifiersChain, type ModifiersChain } from './literals'

/** Start of a query string, and of a fragment — the boundaries after a filename. */
const QUERY_RE = /[?#]/
const HASH_RE = /#/

/**
 * A single-file CDN url cut into the strings {@link tinyBuild} joins back
 * together. Only `origin` and `uuid` are required; the rest default to empty, so
 * a bare url is `{ origin, uuid }`. The field names match `ParsedFileUrl`, with
 * `modifiers` standing in for its `operations`.
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 * @example
 * ```ts
 * // https://ucarecdn.com/:uuid/-/resize/300x/photo.jpg?v=2#top
 * // └── origin ───────┘ └uuid┘ └modifiers──┘ └filename┘└sr┘└hash┘
 * ```
 */
export interface TinyFileUrl {
  /** Scheme + host. A trailing slash is tolerated and trimmed on build. */
  origin: string
  /** The uuid — the first path segment. */
  uuid: string
  /** The directive chain between uuid and filename. Optional, empty by default. */
  modifiers?: ModifiersChain
  /** Trailing filename. Optional — omit it for a url that ends with a slash. */
  filename?: string
  /** Query string (`'?…'`). Optional, empty by default. */
  search?: string
  /** Fragment (`'#…'`). Optional, empty by default. */
  hash?: string
}

/**
 * Cuts a single-file CDN url into {@link TinyFileUrl} — the tiny counterpart of
 * `parseFileUrl`. Never throws and never validates: unknown operations and
 * internal `@`-prefixed directives survive verbatim, and a secure-delivery token
 * is kept in `search`.
 *
 * **File urls only.** The cuts are lexical, so a group, group element or proxy
 * url produces meaningless fields — though {@link tinyBuild} still reproduces it
 * exactly. Use `parseCdnUrl` when the kind is not already known.
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 * @example
 * ```ts
 * tinyParse('https://ucarecdn.com/:uuid/-/resize/300x/photo.jpg')
 * // → { origin: 'https://ucarecdn.com', uuid: ':uuid',
 * //     modifiers: '-/resize/300x/', filename: 'photo.jpg', search: '', hash: '' }
 * ```
 */
export function tinyParse(url: string): TinyFileUrl {
  const pathStart = url.indexOf('/', url.indexOf('//') + 2)
  const path = pathStart === -1 ? '' : url.slice(pathStart + 1)
  const uuidEnd = path.indexOf('/')
  const rest = uuidEnd === -1 ? '' : path.slice(uuidEnd + 1)
  // The last `/` is the modifier/filename boundary: a filename never contains
  // one, and a url that ends in `/` has no filename.
  const cut = rest.lastIndexOf('/')
  const trailing = rest.slice(cut + 1)
  const query = trailing.search(QUERY_RE)
  const fragment = trailing.search(HASH_RE)
  const queryEnd = fragment === -1 ? trailing.length : fragment
  return {
    origin: pathStart === -1 ? url : url.slice(0, pathStart),
    uuid: uuidEnd === -1 ? path : path.slice(0, uuidEnd),
    modifiers: asModifiersChain(cut === -1 ? '' : `${rest.slice(0, cut)}/`),
    filename: query === -1 ? trailing : trailing.slice(0, query),
    search: query === -1 ? '' : trailing.slice(query, queryEnd),
    hash: fragment === -1 ? '' : trailing.slice(fragment)
  }
}

/**
 * Joins {@link TinyFileUrl} back into a url — the tiny counterpart of
 * `serializeFileUrl`. Every field but `origin` and `uuid` is optional, so this
 * builds a url from scratch as readily as it rebuilds a parsed one. A trailing
 * slash on `origin` is trimmed, matching `serializeFileUrl`; nothing else is
 * normalized.
 *
 * Edit `modifiers` through `modifiers()`, which takes typed `OperationLiteral`s,
 * and `joinModifiers()` to append: the field is nominally typed, so a
 * hand-written string will not go in. Drop the chain by omitting the field.
 *
 * @see https://uploadcare.com/docs/cdn-operations/
 * @example
 * ```ts
 * tinyBuild({ origin, uuid, modifiers: modifiers('preview/800x600') })
 * // → https://ucarecdn.com/:uuid/-/preview/800x600/
 *
 * const parts = tinyParse(stored) // …/:uuid/-/preview/photo.jpg
 * tinyBuild({
 *   ...parts,
 *   modifiers: joinModifiers(parts.modifiers, modifiers('blur/10'))
 * })
 * // → https://ucarecdn.com/:uuid/-/preview/-/blur/10/photo.jpg
 * ```
 */
export function tinyBuild(input: TinyFileUrl): string {
  // The one thing normalized on the way out: an origin from config or
  // `new URL(x).origin + '/'` would otherwise produce `host//:uuid/`.
  const origin = trimTrailingSlashes(input.origin)
  return `${origin}/${input.uuid}/${input.modifiers ?? ''}${input.filename ?? ''}${input.search ?? ''}${input.hash ?? ''}`
}
