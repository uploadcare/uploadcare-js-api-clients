/**
 * Deriving a project's CDN host from its public key. Reached through
 * `@uploadcare/cdn-url/cdn-base`, never through a url-building entry.
 *
 * This is the only part of the package that needs a SHA-256, and it gets one
 * from `@uploadcare/cname-prefix`, which is left external so the consumer's
 * bundler or runtime picks the build for its environment. Keeping it off the
 * url-building entries means nothing that only formats urls carries a digest,
 * and nobody who pastes a host as a literal pays for one.
 */
import { getPrefixedCdnBaseAsync } from '@uploadcare/cname-prefix/async'
import { getPrefixedCdnBaseSync } from '@uploadcare/cname-prefix/sync'

import { PREFIX_CDN_BASE } from './constants'
import { trimTrailingSlashes } from '../grammar'

/**
 * Your project's prefixed CDN base: `<prefix>.ucarecd.net`, computed with
 * WebCrypto. **A browser API** — and the one to prefer there, since it adds
 * ~0.3 kB to a bundle against ~1 kB for {@link prefixedCdnBase}, which has to
 * carry a SHA-256 of its own to be able to return without awaiting.
 *
 * On Node it rejects with a `TypeError` pointing at {@link prefixedCdnBase},
 * which is native there and needs no await. Nothing is broken by importing it in
 * code that runs in both places, as long as only the browser path calls it.
 *
 * Being async, it cannot be inlined into a `base(...)` call — resolve it once at
 * startup and keep the string.
 *
 * @param publicKey - The project's public key.
 * @param cdnBase - The zone to prefix; defaults to {@link PREFIX_CDN_BASE}. Pass
 *   one explicitly only if you deliver from a different prefixed zone.
 * @returns The prefixed base, without a trailing slash.
 *
 * @example
 * ```ts
 * const cdn = base(await prefixedCdnBaseAsync('demopublickey'))
 * myCdn.file(uuid).href
 * // https://1s4oyld5dc.ucarecd.net/:uuid/
 * ```
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 */
export const prefixedCdnBaseAsync = (
  publicKey: string,
  cdnBase: string = PREFIX_CDN_BASE
): Promise<string> =>
  getPrefixedCdnBaseAsync(publicKey, trimTrailingSlashes(cdnBase))

/**
 * Your project's prefixed CDN base: `<prefix>.ucarecd.net`, computed
 * synchronously. **Prefer this one on the server**, where it uses `node:crypto`
 * and costs ~0.2 kB, or anywhere awaiting is awkward — a config module's
 * top-level export, a synchronous render path, a React Native bundle.
 *
 * In a browser it carries its own SHA-256 (~1 kB), because `crypto.subtle` only
 * answers asynchronously and no synchronous code can wait for a promise. If you
 * can await, {@link prefixedCdnBaseAsync} is the cheaper browser choice.
 *
 * @param publicKey - The project's public key.
 * @param cdnBase - The zone to prefix; defaults to {@link PREFIX_CDN_BASE}. Pass
 *   one explicitly only if you deliver from a different prefixed zone.
 * @returns The prefixed base, without a trailing slash.
 *
 * @example
 * ```ts
 * prefixedCdnBase('demopublickey')
 * // https://1s4oyld5dc.ucarecd.net
 *
 * cdn.base(prefixedCdnBase('demopublickey')).file(uuid).href
 * // https://1s4oyld5dc.ucarecd.net/:uuid/
 * ```
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 */
export const prefixedCdnBase = (
  publicKey: string,
  cdnBase: string = PREFIX_CDN_BASE
): string => getPrefixedCdnBaseSync(publicKey, trimTrailingSlashes(cdnBase))
