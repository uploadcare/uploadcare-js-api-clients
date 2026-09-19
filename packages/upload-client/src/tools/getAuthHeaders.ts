import { getAuthHeaders as buildAuthHeaders } from '@uploadcare/signed-uploads/client'
import { AuthToken } from '../types'
import { Headers } from '../request/types'
import { resolveAuthToken } from './resolveAuthToken'

/**
 * Resolves the auth token (calling the resolver if one is given) and returns
 * the `Authorization` header, or an empty object when no token is provided.
 * Must be called per request, not per upload, so resolvers can rotate tokens
 * mid-flight.
 *
 * The header itself is built by `@uploadcare/signed-uploads`, which owns the
 * scheme, so the two packages cannot drift on what the header looks like.
 */
export const getAuthHeaders = async (
  authToken: AuthToken | undefined
): Promise<Headers> => buildAuthHeaders(await resolveAuthToken(authToken))
