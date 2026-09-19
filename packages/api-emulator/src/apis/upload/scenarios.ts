/**
 * Every magic value `/from_url/` (and the public-key gate in `auth.ts`) tests
 * against, named here so a route file never carries a bare string a test
 * elsewhere is quietly relying on.
 */

/**
 * `upload-client`'s `uploadFromUrl.test.ts` ("should be able to handle
 * non-computable unknown progress") uses this public key to get a poll sequence
 * whose `total` is `'unknown'` instead of a byte count.
 */
export const UNKNOWN_PROGRESS_KEY = 'pub_test__unknown_progress'

/**
 * `upload-client`'s multipart fixtures (`_fixtureFactory.ts`'s `multipart`
 * entry) use this public key. Not read by `/from_url/` itself — kept here so
 * `auth.ts`'s allow-list and Task 5's multipart routes share one spelling
 * instead of two.
 */
export const NO_STORING_KEY = 'pub_test__no_storing'

/**
 * `upload-client`'s `fromUrl.test.ts` ("should be rejected with image that does
 * not exists") and `_fixtureFactory.ts`'s `imageUrl('doesNotExist')`. This one
 * host fails fast, at `POST /from_url/` itself, with a 400 — unlike an ordinary
 * unreachable host (see `REACHABLE_HOSTS` below), which only fails once the job
 * is polled. The real API doesn't actually special-case this URL; the old mock
 * server did, and `upload-client`'s test asserts on the synchronous rejection,
 * so the emulator preserves it.
 */
export const UNREACHABLE_SOURCE_URL = 'https://1.com/1.jpg'

/**
 * The emulator's own default origin (`cli.ts`'s default `PORT`).
 * `upload-client`'s dev settings point `baseCDN`/`baseURL` at exactly this
 * host, and its "valid" `from_url` fixture (`_fixtureFactory.ts`'s
 * `imageUrl('valid')`) is a URL on it — so the private-address rule below must
 * not reject it, the same exemption the old mock server carved out for its own
 * `PORT`.
 */
const EMULATOR_OWN_HOST = 'localhost:3000'

/**
 * `upload-client`'s `fromUrl.test.ts` ("should be rejected with image from
 * private IP") and `_fixtureFactory.ts`'s `imageUrl('privateIP')`
 * (`http://192.168.1.10/1.jpg`), plus any `localhost` host other than the
 * emulator's own (see `EMULATOR_OWN_HOST`).
 */
export const isPrivateSourceUrl = (sourceUrl: string): boolean => {
  const host = URL.parse(sourceUrl)?.host ?? ''
  if (host === EMULATOR_OWN_HOST) return false
  return host.includes('192.168.') || host.includes('localhost')
}

/**
 * The hosts a `from_url` upload can actually be "fetched" from. Nothing is ever
 * really fetched — the job resolves to a stock image under the name the URL
 * implies — so the emulator has no other way to learn that a host doesn't
 * resolve the way the real service would; it has to be told.
 *
 * `localhost:3000` covers `upload-client`'s own dev-settings host (see
 * `EMULATOR_OWN_HOST`). The rest mirror the browser fake's list
 * (`tests/utils/fake-uploadcare/upload-api.ts` in the file-uploader repo): that
 * suite's from-url validation tests point at a host that is deliberately _not_
 * in this list to get the poll-time `Host does not exist` failure (see
 * `from-url.ts`), rather than the fast, synchronous one
 * `UNREACHABLE_SOURCE_URL` triggers above.
 */
export const REACHABLE_HOSTS = [
  EMULATOR_OWN_HOST,
  'images.unsplash.com',
  'ucarecdn.com'
]

/**
 * `upload-client`'s `group.test.ts` ("should fail with [HTTP 400] Some files
 * not found.") uses this public key — otherwise a perfectly ordinary allowed
 * key (see `auth.ts`) — to make `POST /group/` fail every time, regardless of
 * whether its members exist. Mirrors the old mock server's
 * `controllers/group.ts` hack (`publicKey === 'demopublickey'`), scoped to
 * `/group/` alone so every other route's use of the same key as "a normal demo
 * project" is unaffected.
 */
export const GROUP_FILES_NOT_FOUND_KEY = 'demopublickey'
