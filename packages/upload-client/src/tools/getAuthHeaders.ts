import { AuthToken } from '../types'
import { Headers } from '../request/types'

export const resolveAuthToken = (
  authToken: AuthToken | undefined
): Promise<string | undefined> =>
  Promise.resolve(typeof authToken === 'function' ? authToken() : authToken)

/**
 * Resolves the auth token (calling the resolver if one is given) and returns
 * the `Authorization` header, or an empty object when no token is provided.
 * Must be called per request, not per upload, so resolvers can rotate tokens
 * mid-flight.
 */
export const getAuthHeaders = async (
  authToken: AuthToken | undefined
): Promise<Headers> => {
  const token = await resolveAuthToken(authToken)
  return token ? { Authorization: `Bearer ${token}` } : {}
}
