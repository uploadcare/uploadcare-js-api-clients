import { apiError } from '../../core/responses.js'
import { NO_STORING_KEY, UNKNOWN_PROGRESS_KEY } from './scenarios.js'

/**
 * The public keys the demo project recognises, mirroring the old mock server's
 * list.
 */
const ALLOWED_PUBLIC_KEYS = [
  'demopublickey',
  'secret_public_key',
  NO_STORING_KEY,
  UNKNOWN_PROGRESS_KEY
]

/**
 * The Upload API checks the public key before it looks at anything else in the
 * request, so an unrelated 404 never masks a missing or invalid key.
 * `paramName` differs by route: query-string routes report on `pub_key`,
 * `/base/` reports on `UPLOADCARE_PUB_KEY` since that's where the client puts
 * it.
 */
export const requirePublicKey = (
  request: Request,
  publicKey: string | null,
  paramName = 'pub_key'
) => {
  if (!publicKey)
    // schema: publicKeyRequiredError / uploadcarePublicKeyRequiredError
    return apiError(
      request,
      403,
      `${paramName} is required.`,
      'ProjectPublicKeyInvalidError'
    )
  if (!ALLOWED_PUBLIC_KEYS.includes(publicKey))
    // schema: publicKeyInvalidError / uploadcarePublicKeyInvalidError
    return apiError(
      request,
      403,
      `${paramName} is invalid.`,
      'ProjectPublicKeyInvalidError'
    )
  return undefined
}
