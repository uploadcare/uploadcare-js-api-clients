export { defaultProxyEndpoint, isProxyEndpoint } from './endpoint'
export { proxyUrl } from './proxy-url'
// Every url this entry builds needs a CDN base, so the helpers that derive one
// are re-exported here too — same symbols as the root entry, resolved to the same
// module, so nothing is duplicated in a bundle and nothing is paid for unless
// named. See `src/prefixed-cdn-base.ts`.
export { LEGACY_CDN_BASE, PREFIX_CDN_BASE } from '../cdn-base'
export { prefixedCdnBase, prefixedCdnBaseAsync } from '../prefixed-cdn-base'
