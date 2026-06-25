// eslint-disable-next-line import/no-unresolved -- subpath export, resolved by bundler/TS
import { getPrefixedCdnBaseAsync } from '@uploadcare/cname-prefix/async'

/**
 * Browser: derive the per-project prefixed CDN base via the WebCrypto SHA-256
 * implementation, keeping the browser bundle free of the pure-JS fallback.
 */
export const getPrefixedCdnBase = (
  publicKey: string,
  cdnBase: string
): Promise<string> => getPrefixedCdnBaseAsync(publicKey, cdnBase)
