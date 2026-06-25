// eslint-disable-next-line import/no-unresolved -- subpath export, resolved by bundler/TS
import { getPrefixedCdnBaseSync } from '@uploadcare/cname-prefix/sync'

/**
 * React Native: has no `window.crypto.subtle`, so it derives the per-project
 * prefixed CDN base synchronously (pure-JS SHA-256), like Node. Kept
 * self-contained rather than re-exporting the `.node` entry, since the build
 * alias would rewrite that import to this file itself.
 */
export const getPrefixedCdnBase = (
  publicKey: string,
  cdnBase: string
): Promise<string> =>
  Promise.resolve(getPrefixedCdnBaseSync(publicKey, cdnBase))
