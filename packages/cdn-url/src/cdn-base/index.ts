/**
 * Where a project delivers from, in one place: the two zone constants and the
 * two helpers that derive a project's prefixed host from its public key.
 *
 * Every entry point that builds a url re-exports this barrel, because every one
 * of them needs a CDN base. They all resolve to these modules, so a bundle never
 * duplicates them, and per-symbol tree-shaking means nobody pays for the SHA-256
 * behind `prefixedCdnBase` unless they name it.
 *
 * The constants and the helpers stay in separate modules on purpose: merging them
 * would put the hashing code on the same module as `LEGACY_CDN_BASE`, so anything
 * importing a constant would drag that graph edge along.
 */
export { LEGACY_CDN_BASE, PREFIX_CDN_BASE } from './constants'
export { prefixedCdnBase, prefixedCdnBaseAsync } from './prefixed'
