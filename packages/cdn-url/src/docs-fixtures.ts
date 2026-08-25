/**
 * Shared fixtures for the `docs-*.test.ts` files, which mirror the snippets on
 * the documentation pages. The pages all use the same demo project, so the same
 * uuid and host appeared in six files; a changed host meant six edits.
 *
 * Not part of any entry point — nothing imports this outside tests.
 */
import { cdn } from './fluent/index'
import { prefixedCdnBase } from './cdn-base/index'

/** The uuid every page's examples use. */
export const UUID = 'c2499162-eb07-4b93-b31e-94a89a47e858'

/** A second uuid, for examples that overlay one file on another. */
export const LOGO_UUID = '1bac376c-aa7e-4356-861b-dd2ee0d3f45b'

/** The public key the pages derive their host from. */
export const PUBLIC_KEY = 'demopublickey'

/** `prefixedCdnBase(PUBLIC_KEY)` — the host every page prints. */
export const CDN_BASE = 'https://1s4oyld5dc.ucarecd.net'

/** The legacy shared host, for examples about stored or migrated urls. */
export const LEGACY_BASE = 'https://ucarecdn.com'

/** A group of three files, as the group pages use it. */
export const GROUP = { uuid: UUID, count: 3 }

/** The entry object the pages bind at the top of their snippets. */
export const myCdn = cdn.base(prefixedCdnBase(PUBLIC_KEY))
