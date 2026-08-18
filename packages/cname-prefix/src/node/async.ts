import { addPrefixToCdnBase } from '../common/addPrefixToCdnBase'
import { cnamePrefix } from '../common/cnamePrefix'
import { sha256EncodeAsync } from './sha256EncodeAsync'

export { isPrefixedCdnBase } from '../common/isPrefixedCdnBase'

/**
 * The prefixed CDN base, derived with the same WebCrypto digest the browser
 * build uses — here taken from `node:crypto`'s `webcrypto`. Node has had
 * WebCrypto since 16.15, so isomorphic code that calls the async API (an SSR
 * render, a shared config module) no longer has to branch on the runtime: it
 * gets the same answer the sync API would, without a `node:crypto` `createHash`
 * on the call path.
 *
 * The result is identical to `getPrefixedCdnBaseSync` for a given public key;
 * on Node the sync one is native and synchronous, so prefer it where you can
 * and reach for this only to keep one code path across environments.
 */
export const getPrefixedCdnBaseAsync = async (
  publicKey: string,
  cdnBase: string
): Promise<string> =>
  addPrefixToCdnBase(cnamePrefix(await sha256EncodeAsync(publicKey)), cdnBase)
