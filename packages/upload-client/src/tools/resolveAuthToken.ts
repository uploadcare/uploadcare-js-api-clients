import { AuthToken } from '../types'

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
export const resolveAuthToken = (
  authToken: AuthToken | undefined
): Promise<string | undefined> =>
  Promise.resolve(isAuthTokenResolver(authToken) ? authToken() : authToken)
