import { AuthToken } from '../types'
import { AuthTokenResolverError } from './AuthTokenResolverError'

/**
 * Whether `authToken` is a resolver rather than a token already in hand.
 *
 * Only a resolver can produce a fresh token, so this is what decides whether
 * retrying an expired-token failure is worth anything.
 */
export const isAuthTokenResolver = (
  authToken: AuthToken | undefined
): authToken is Exclude<AuthToken, string> => typeof authToken === 'function'

/**
 * Collapses the two `authToken` forms into the token itself, calling the
 * resolver when there is one.
 */
export const resolveAuthToken = async (
  authToken: AuthToken | undefined
): Promise<string | undefined> => {
  if (!isAuthTokenResolver(authToken)) return authToken

  // Wrapped so a caller can tell "your resolver broke" from "the server
  // rejected the token", which need different fixes and look identical once
  // the throw has bubbled up through an upload.
  try {
    return await authToken()
  } catch (cause) {
    throw new AuthTokenResolverError(cause)
  }
}
