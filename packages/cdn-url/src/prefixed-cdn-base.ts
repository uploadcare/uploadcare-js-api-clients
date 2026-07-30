import { getPrefixedCdnBaseSync } from '@uploadcare/cname-prefix/sync'

import { PREFIX_CDN_BASE } from './cdn-base'
import { trimTrailingSlashes } from './grammar'

/**
 * Your project's prefixed CDN base: `<prefix>.ucarecd.net`, where the prefix is
 * the first 10 base36 digits of `sha256(publicKey)`.
 *
 * This is `getPrefixedCdnBaseSync` from
 * [`@uploadcare/cname-prefix`](https://www.npmjs.com/package/@uploadcare/cname-prefix)
 * under a shorter name, with {@link PREFIX_CDN_BASE} defaulted in and a trailing
 * slash tolerated. Nothing else prefixes anything on your behalf — pass the
 * result to `base` (or to any `cdnBase` field), and the hashing code only lands
 * in your bundle if you call this.
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
 * base(prefixedCdnBase('demopublickey')).file(uuid).href
 * // https://1s4oyld5dc.ucarecd.net/:uuid/
 * ```
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 */
export const prefixedCdnBase = (
  publicKey: string,
  cdnBase: string = PREFIX_CDN_BASE
): string => getPrefixedCdnBaseSync(publicKey, trimTrailingSlashes(cdnBase))
