/**
 * Every magic value a test steers the emulator with — public keys, source urls,
 * prompts, and the secret test tokens are signed with — named here so a route
 * file never carries a bare string a test elsewhere is quietly relying on.
 */

/**
 * The port `upload-client`'s suite runs the emulator on, on the `127.0.0.1`
 * that `listen.ts` binds. Its dev settings point `baseCDN`/`baseURL` at this
 * origin, and its "valid" `from_url` fixture (`_fixtureFactory.ts`'s
 * `imageUrl('valid')`) is a URL on it, so that host has to be reachable (see
 * `REACHABLE_HOSTS`). It is `127.0.0.1` rather than `localhost` because
 * `localhost` can resolve to `::1` first, where another dev server on the same
 * port would answer instead of the IPv4-only emulator.
 */
export const EMULATOR_PORT = 3000

const EMULATOR_OWN_HOST = `127.0.0.1:${EMULATOR_PORT}`

/**
 * `URL.parse(url)?.host`, spelled with `canParse` because the repo's root
 * TypeScript (5.3) predates `URL.parse`'s typings.
 */
export const hostOf = (url: string) =>
  URL.canParse(url) ? new URL(url).host : undefined

/**
 * `upload-client`'s `fromUrl.test.ts` ("should be rejected with image from
 * private IP") and `_fixtureFactory.ts`'s `imageUrl('privateIP')`
 * (`http://192.168.1.10/1.jpg`), plus any `localhost` host.
 */
export const isPrivateSourceUrl = (sourceUrl: string): boolean => {
  const host = hostOf(sourceUrl) ?? ''
  return host.includes('192.168.') || host.includes('localhost')
}

/**
 * The hosts a `from_url` upload can actually be "fetched" from. Nothing is ever
 * really fetched — the job resolves to a stock image under the name the URL
 * implies — so the emulator has no other way to learn that a host doesn't
 * resolve the way the real service would; it has to be told.
 *
 * `EMULATOR_OWN_HOST` covers `upload-client`'s own dev-settings host; the rest
 * are the hosts file-uploader's e2e suite uploads from. Its from-url validation
 * tests point at a host that is deliberately _not_ in this list to get the
 * poll-time `Host does not exist` failure (see `from-url.ts`), rather than the
 * fast, synchronous one the `hostNotFound` preset answers.
 */
export const REACHABLE_HOSTS = [
  EMULATOR_OWN_HOST,
  'images.unsplash.com',
  'ucarecdn.com'
]
