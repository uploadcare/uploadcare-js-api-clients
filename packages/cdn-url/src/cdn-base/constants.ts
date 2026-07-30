/**
 * The legacy shared CDN base. It serves any project's files unprefixed, which
 * is why it is the only safe fallback — but new projects should deliver from
 * their own prefixed host — see `prefixedCdnBase` — rather than reach for this.
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 */
export const LEGACY_CDN_BASE = 'https://ucarecdn.com'

/**
 * The zone a project prefix is prepended to: `<prefix>.ucarecd.net`, which is
 * what {@link prefixedCdnBase} computes. Not a typo for `ucarecdn.com` — it is
 * the separate zone that serves per-project prefixed hostnames, and it only
 * answers **with** a prefix, never bare.
 *
 * @see https://uploadcare.com/docs/delivery/cdn/
 */
export const PREFIX_CDN_BASE = 'https://ucarecd.net'
