export const isPrefixedCdnBase = (cdnBase: string, prefixCdnBase: string) => {
  try {
    const host = new URL(cdnBase).hostname
    const base = new URL(prefixCdnBase).hostname
    // Match the zone itself or a subdomain of it, on a label boundary — so
    // `ucarecd.net` and `<prefix>.ucarecd.net` match, but `notucarecd.net`
    // (which merely ends with the same string) does not.
    return host === base || host.endsWith(`.${base}`)
  } catch (_err) {
    return false
  }
}
