import type { DomainKind } from './types'

/**
 * Classifies a CDN host:
 * - `legacy` — `ucarecdn.com` (and its environment subdomains)
 * - `prefixed` — project-prefixed `*.ucarecd.net`
 * - `proxy` — delivery proxy `*.ucr.io`
 * - `custom` — anything else (user CNAME)
 *
 * @throws TypeError on unparseable input.
 * @see https://uploadcare.com/docs/delivery/cdn/
 * @example
 * ```ts
 * detectDomainKind('https://1zlmtnsbgr.ucarecd.net') // → 'prefixed'
 * ```
 */
export function detectDomainKind(url: string): DomainKind {
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    throw new TypeError(`Invalid URL: "${url}"`)
  }
  if (hostname === 'ucarecdn.com' || hostname.endsWith('.ucarecdn.com'))
    return 'legacy'
  if (hostname === 'ucarecd.net' || hostname.endsWith('.ucarecd.net'))
    return 'prefixed'
  if (hostname === 'ucr.io' || hostname.endsWith('.ucr.io')) return 'proxy'
  return 'custom'
}

/**
 * Whether the host is operated by Uploadcare (not a custom CNAME).
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 * @example
 * ```ts
 * isUploadcareDomain('https://cdn.example.com') // → false
 * ```
 */
export function isUploadcareDomain(url: string): boolean {
  return detectDomainKind(url) !== 'custom'
}
