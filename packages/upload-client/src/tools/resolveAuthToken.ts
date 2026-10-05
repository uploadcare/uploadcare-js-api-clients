import {
  asAuthTokenResolverError,
  requireAuthToken
} from '@uploadcare/signed-uploads/client'
import { AuthToken, AuthTokenProvider, AuthTokenResolver } from '../types'

type NormalizedAuthToken = {
  getToken: AuthTokenResolver
  invalidate?: () => void
}

/**
 * Whether `authToken` can produce a fresh token rather than being one already.
 *
 * Only a resolver can, so this is what decides whether retrying an auth failure
 * is worth anything.
 */
export const isAuthTokenResolver = (
  // `null` as well as `undefined`: a host config commonly holds one for "no
  // token", and making every caller coerce it buys nothing.
  authToken: AuthToken | null | undefined
): authToken is AuthTokenResolver | AuthTokenProvider =>
  typeof authToken === 'function' ||
  (typeof authToken === 'object' &&
    authToken !== null &&
    typeof authToken.getToken === 'function')

/**
 * The provider form of a resolver, so callers need not care which of the two
 * shapes they were given.
 *
 * Both members are bound. `AuthTokenCache.invalidate` is a prototype method, so
 * calling it off a detached reference would throw on `this`.
 */
export const normalizeAuthToken = (
  authToken: AuthTokenResolver | AuthTokenProvider
): NormalizedAuthToken =>
  typeof authToken === 'function'
    ? { getToken: authToken }
    : {
        getToken: authToken.getToken.bind(authToken),
        invalidate: authToken.invalidate?.bind(authToken)
      }

/**
 * Collapses the `authToken` forms into the token itself, calling the resolver
 * when there is one.
 */
export const resolveAuthToken = async (
  authToken: AuthToken | undefined
): Promise<string | undefined> => {
  if (!authToken || typeof authToken === 'string') return authToken
  if (!isAuthTokenResolver(authToken)) {
    // Neither a token nor something that can produce one. Caught here rather
    // than left to send a request with no header, which comes back as
    // `SignatureRequiredError` with nothing pointing at the malformed option.
    throw new TypeError(
      '`authToken` must be a token, a function returning one, or an object with a `getToken` function'
    )
  }

  // Wrapped so a caller can tell "your resolver broke" from "the server
  // rejected the token", which need different fixes and look identical once
  // the throw has bubbled up through an upload.
  try {
    return requireAuthToken(await normalizeAuthToken(authToken).getToken())
  } catch (cause) {
    throw asAuthTokenResolverError(cause)
  }
}
