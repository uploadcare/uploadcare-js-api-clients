/**
 * Where a project delivers from — the `@uploadcare/cdn-url/cdn-base` entry: the
 * two zone constants, and the helpers that derive a project's own prefixed host
 * from its public key.
 *
 * The url-building entries re-export `./constants` rather than this barrel, so
 * the SHA-256 behind the helpers stays out of any bundle that only formats urls.
 * Importing a constant from here costs nothing extra either — the modules are
 * separate and the package is side-effect free.
 */
export { LEGACY_CDN_BASE, PREFIX_CDN_BASE } from './constants'
export { prefixedCdnBase, prefixedCdnBaseAsync } from './prefixed'
