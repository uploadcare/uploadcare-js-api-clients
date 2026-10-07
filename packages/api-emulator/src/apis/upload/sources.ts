/**
 * Where a `/from_url/` source can be fetched from: the emulator fetches
 * nothing, so it models which hosts resolve and which addresses the real API
 * refuses. Per-test deviations from this are presets (see `presets.ts`), not
 * values here.
 */

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
 * The CDN is upload-client's "valid" source (`_fixtureFactory.ts`'s
 * `imageUrl('valid')`); the rest are the hosts file-uploader's e2e suite
 * uploads from. Its from-url validation tests point at a host that is
 * deliberately _not_ in this list to get the poll-time `Host does not exist`
 * failure (see `from-url.ts`), rather than the fast, synchronous one the
 * `hostNotFound` preset answers.
 */
export const REACHABLE_HOSTS = ['images.unsplash.com', 'ucarecdn.com']
