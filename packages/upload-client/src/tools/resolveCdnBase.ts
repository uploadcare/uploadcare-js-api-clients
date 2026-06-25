import { isPrefixedCdnBase } from '@uploadcare/cname-prefix'
import defaultSettings from '../defaultSettings'
import { getPrefixedCdnBase } from './getPrefixedCdnBase.node'

/**
 * Resolve the effective CDN base used to build an uploaded file's `cdnUrl`.
 *
 * By default — or when an explicit `baseCDN` already points at the prefixed
 * zone — the per-project prefixed base is derived from `publicKey` (e.g.
 * `https://<prefix>.ucarecd.net`). Any other custom `baseCDN` is returned
 * untouched, which is how callers opt out of prefixing.
 *
 * The `getPrefixedCdnBase` import is environment-split at build time: WebCrypto
 * in the browser, pure-JS SHA-256 in Node / React Native.
 */
export const resolveCdnBase = ({
  publicKey,
  baseCDN = defaultSettings.baseCDN,
  prefixedBaseCDN = defaultSettings.prefixedBaseCDN
}: {
  publicKey: string
  baseCDN?: string
  prefixedBaseCDN?: string
}): Promise<string> => {
  // Compare slash-insensitively so the documented default is recognised
  // whether passed as `https://ucarecdn.com` or `https://ucarecdn.com/`.
  const isDefaultBase =
    baseCDN.replace(/\/+$/, '') === defaultSettings.baseCDN.replace(/\/+$/, '')

  if (
    publicKey &&
    (isDefaultBase || isPrefixedCdnBase(baseCDN, prefixedBaseCDN))
  ) {
    return getPrefixedCdnBase(publicKey, prefixedBaseCDN)
  }

  return Promise.resolve(baseCDN)
}
