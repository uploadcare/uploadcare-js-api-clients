import { apiError } from './responses.js'

/**
 * The public keys the demo project recognises, mirroring the old mock server's
 * list.
 */
const ALLOWED_PUBLIC_KEYS = [
  'demopublickey',
  'secret_public_key',
  'pub_test__no_storing',
  'pub_test__unknown_progress'
]

/**
 * The Upload API checks the public key before it looks at anything else in the
 * request, so an unrelated 404 never masks a missing or invalid key.
 * `paramName` differs by route: query-string routes report on `pub_key`,
 * `/base/` reports on `UPLOADCARE_PUB_KEY` since that's where the client puts
 * it.
 */
export const requirePublicKey = (
  publicKey: string | null,
  paramName = 'pub_key'
) => {
  if (!publicKey)
    return apiError(
      403,
      `${paramName} is required.`,
      'ProjectPublicKeyInvalidError'
    )
  if (!ALLOWED_PUBLIC_KEYS.includes(publicKey))
    return apiError(
      403,
      `${paramName} is invalid.`,
      'ProjectPublicKeyInvalidError'
    )
  return undefined
}
