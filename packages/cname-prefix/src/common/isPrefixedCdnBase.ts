export const isPrefixedCdnBase = (cdnBase: string, prefixCdnBase: string) => {
  try {
    const cdnBaseUrl = new URL(cdnBase)
    const prefixCdnBaseUrl = new URL(prefixCdnBase)
    return cdnBaseUrl.hostname.endsWith(prefixCdnBaseUrl.hostname)
  } catch (_err) {
    return false
  }
}
