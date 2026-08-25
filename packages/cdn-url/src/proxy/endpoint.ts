/**
 * The auto-generated per-project delivery proxy endpoint:
 * `https://<publicKey>.ucr.io`.
 *
 * @see https://uploadcare.com/docs/delivery/proxy/
 * @example
 * ```ts
 * defaultProxyEndpoint('demopublickey') // → https://demopublickey.ucr.io
 * ```
 */
export function defaultProxyEndpoint(publicKey: string): string {
  return `https://${publicKey}.ucr.io`
}

/**
 * Whether the url points at an `*.ucr.io` proxy endpoint. Custom proxy
 * CNAMEs outside the `ucr.io` zone are not detectable from the url alone.
 *
 * @see https://uploadcare.com/docs/delivery/proxy/
 */
export function isProxyEndpoint(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname === 'ucr.io' || hostname.endsWith('.ucr.io')
  } catch {
    return false
  }
}
