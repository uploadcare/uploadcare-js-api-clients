import { isPrefixedCdnBase } from '@uploadcare/cname-prefix'
import defaultSettings from '../defaultSettings'
import { getPrefixedCdnBase } from './getPrefixedCdnBase.node'

/**
 * Resolve the effective CDN base used to build an uploaded file's `cdnUrl`.
 *
 * Prefixing is the default: when no `baseCDN` is provided — or when the
 * provided `baseCDN` already points at the prefixed zone (idempotent
 * re-derivation) — the per-project prefixed base is derived from `publicKey`
 * (e.g. `https://<prefix>.ucarecd.net`).
 *
 * Any other explicitly provided `baseCDN` is used verbatim. That is how callers
 * keep a legacy or custom domain — including the classic
 * `https://ucarecdn.com`: pass it explicitly to opt out of prefixing.
 *
 * The `getPrefixedCdnBase` import is environment-split at build time: WebCrypto
 * in the browser, pure-JS SHA-256 in Node / React Native.
 */
export const resolveCdnBase = ({
  publicKey,
  baseCDN,
  prefixedBaseCDN = defaultSettings.prefixedBaseCDN
}: {
  publicKey: string
  baseCDN?: string
  prefixedBaseCDN?: string
}): Promise<string> => {
  // Without a public key there is nothing to derive a prefix from.
  if (!publicKey) {
    return Promise.resolve(baseCDN ?? defaultSettings.baseCDN)
  }

  // Prefix when the caller did not set a base, or explicitly targets the
  // prefixed zone; any other explicit base is returned verbatim (opt-out).
  if (baseCDN === undefined || isPrefixedCdnBase(baseCDN, prefixedBaseCDN)) {
    return getPrefixedCdnBase(publicKey, prefixedBaseCDN)
  }

  return Promise.resolve(baseCDN)
}
