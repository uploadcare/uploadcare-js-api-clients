export const addPrefixToCdnBase = (prefix: string, cdnBase: string): string => {
  const url = new URL(cdnBase)
  url.hostname = `${prefix}.${url.hostname}`
  const prefixedUrl = url.toString()
  return prefixedUrl.replace(/\/$/, '')
}
