// eslint-disable-next-line import/no-unresolved -- subpath export, resolved by bundler/TS
import { getPrefixedCdnBaseSync } from '@uploadcare/cname-prefix/sync'

/**
 * Node / React Native: derive the per-project prefixed CDN base synchronously
 * (pure-JS SHA-256). Wrapped in a Promise so every environment shares one
 * signature with the browser (WebCrypto) variant.
 *
 * The build replaces this `.node` import with the matching environment file via
 * the rollup alias (see `createRollupConfig.js`).
 */
export const getPrefixedCdnBase = (
  publicKey: string,
  cdnBase: string
): Promise<string> =>
  Promise.resolve(getPrefixedCdnBaseSync(publicKey, cdnBase))
