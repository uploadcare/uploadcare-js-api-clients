/**
 * Every magic value a test steers the emulator with — public keys, source urls,
 * prompts, and the secret test tokens are signed with — named here so a route
 * file never carries a bare string a test elsewhere is quietly relying on.
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
 * `auth.ts`'s allow-list and the multipart routes share one spelling instead of
 * two.
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
 * `URL.parse(url)?.host`, spelled with `canParse` because the repo's root
 * TypeScript (5.3) predates `URL.parse`'s typings.
 */
export const hostOf = (url: string) =>
  URL.canParse(url) ? new URL(url).host : undefined

/**
 * `upload-client`'s `fromUrl.test.ts` ("should be rejected with image from
 * private IP") and `_fixtureFactory.ts`'s `imageUrl('privateIP')`
 * (`http://192.168.1.10/1.jpg`), plus any `localhost` host other than the
 * emulator's own (see `EMULATOR_OWN_HOST`).
 */
export const isPrivateSourceUrl = (sourceUrl: string): boolean => {
  const host = hostOf(sourceUrl) ?? ''
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
 * The one uuid `POST /group/` accepts without it being in the session:
 * `upload-client`'s `factory.groupOfFiles('valid')` groups it without ever
 * uploading it first (`group.test.ts`' "should create group of files",
 * `uploadFileGroup/groupFromUploaded.test.ts`), as the old mock server — which
 * never checked a store — allowed. It stands in as a 0-byte file. Every other
 * unknown member is "Some files not found.", as the real API answers.
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
 * `upload-client`'s `test/api/authToken.test.ts` uses this public key as the
 * stand-in for a project with Signed Uploads switched on: a request under it
 * that carries no Bearer token is refused with `SignatureRequiredError`,
 * whatever the endpoint. Mirrors the old mock server's `config.ts`.
 */
export const SIGNED_UPLOADS_PUBLIC_KEY = 'pub_test__signed_uploads'

/**
 * The secret `auth.ts` verifies Bearer tokens (HS256 JWTs, keyed with
 * `sha256(secret)`, as `@uploadcare/signed-uploads`' `generateAuthToken` mints
 * them) against. `upload-client`'s `test/api/authToken.test.ts` mints real
 * tokens with it, so one suite runs against both the emulator and production.
 */
// Public test fixture, documented in the README — not a real credential.
export const SIGNED_UPLOADS_SECRET_KEY = 'mock_secret_key'

/**
 * `upload-client`'s `test/api/authToken.test.ts` ("should refresh an expired
 * token that surfaces after a throttle retry") sends `metadata: {
 * mock_throttle: '<key>' }` to have the first request carrying a given key
 * answered 429 with `retry-after: 1`; every later one with the same key passes.
 * The key is spent per session — tests use a unique one per run. Mirrors the
 * old mock server's `middleware/throttleOnce.ts`.
 */
export const THROTTLE_ONCE_FIELD = 'metadata[mock_throttle]'

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
