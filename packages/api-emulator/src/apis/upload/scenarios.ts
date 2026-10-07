/**
 * Every magic value a test steers the emulator with — public keys, source urls,
 * prompts, and the secret test tokens are signed with — named here so a route
 * file never carries a bare string a test elsewhere is quietly relying on.
 */

/**
 * `upload-client`'s multipart fixtures (`_fixtureFactory.ts`'s `multipart`
 * entry) use this public key. Not read by `/from_url/` itself — kept here so
 * `auth.ts`'s allow-list and the multipart routes share one spelling instead of
 * two.
 */
export const NO_STORING_KEY = 'pub_test__no_storing'

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

/**
 * The one uuid `POST /group/` accepts without it being in the session:
 * `upload-client`'s `factory.groupOfFiles('valid')` groups it without ever
 * uploading it first (`group.test.ts`' "should create group of files",
 * `uploadFileGroup/groupFromUploaded.test.ts`). It stands in as a 0-byte file.
 * Every other unknown member is "Some files not found.", as the real API
 * answers.
 */
export const STUB_GROUP_MEMBER = '392e3aa3-5ed6-4ad6-a67e-b3a7c1d5b9e9'

/**
 * `upload-client`'s `group.test.ts` ("should fail with [HTTP 400] Some files
 * not found.") groups `STUB_GROUP_MEMBER` under this public key and expects
 * `groupFilesNotFoundError` — so under this key, and only on `POST /group/`,
 * even the stub counts as missing. A real upload grouped under it still
 * succeeds (file-uploader's e2e suite does exactly that; it's a widely used
 * real demo public key). Everywhere else it's an ordinary allowed key.
 */
export const GROUP_FILES_NOT_FOUND_KEY = 'demopublickey'

/**
 * Ai-image-editor's `errorCodes.ts` (`derivative_disabled`): a project without
 * AI generation. `POST /derivative/image/generate/` and `.../edit/` under this
 * otherwise ordinary allowed key (see `auth.ts`) answer `derivative_disabled`
 * before a job exists. Exported from `.`.
 */
export const DERIVATIVE_DISABLED_PUBLIC_KEY = 'pub_test__derivative_disabled'

/**
 * Ai-image-editor's browser suite: its editor polls `derivative/status/` every
 * 1.5s and can't be told otherwise, so the default walk (four frames) would
 * keep each generation waiting about 4.5s. A derivative job under this
 * otherwise ordinary allowed key answers its first poll with its terminal
 * frame: a ready `success`, or a scenario prompt's error. Exported from `.`.
 */
export const DERIVATIVE_INSTANT_PUBLIC_KEY = 'pub_test__derivative_instant'

/**
 * Prompts whose derivative job fails at poll time instead of producing a file —
 * the AI-gateway failures ai-image-editor maps to its own messages
 * (`content_moderated`, `provider_unavailable`). The job reports `processing`
 * once, then the error frame for good. Exported from `.`.
 */
export const CONTENT_MODERATED_PROMPT = 'mock_content_moderated'
export const PROVIDER_UNAVAILABLE_PROMPT = 'mock_provider_unavailable'

/** Keyed by prompt. A `Map`, so a prompt like `constructor` matches nothing. */
export const DERIVATIVE_FAILURES = new Map([
  [
    CONTENT_MODERATED_PROMPT,
    {
      code: 'content_moderated',
      message: 'The request was rejected by content moderation.'
    }
  ],
  [
    PROVIDER_UNAVAILABLE_PROMPT,
    {
      code: 'provider_unavailable',
      message: 'The image generation provider is unavailable.'
    }
  ]
])
