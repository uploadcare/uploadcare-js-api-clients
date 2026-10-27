import { CustomUserAgent } from '@uploadcare/api-client-utils'
import { getAuthHeaders } from '@uploadcare/signed-uploads/client'
import { Headers } from '../request/types'
import { AuthToken } from '../types'
import { resolveAuthToken } from './resolveAuthToken'
import { getUserAgent } from './getUserAgent'

type GetRequestHeadersOptions = {
  publicKey?: string
  integration?: string
  userAgent?: CustomUserAgent
  authToken?: AuthToken
}

/**
 * Headers for one Upload API request.
 *
 * Called per request rather than per upload, so an `authToken` resolver can
 * rotate the token mid-flight. The Authorization header itself is built by
 * `@uploadcare/signed-uploads`, which owns the scheme, so the two packages
 * cannot drift on what it looks like.
 */
export const getRequestHeaders = async ({
  publicKey,
  integration,
  userAgent,
  authToken
}: GetRequestHeadersOptions): Promise<Headers> => ({
  ...(publicKey
    ? {
        'X-UC-User-Agent': getUserAgent({ publicKey, integration, userAgent })
      }
    : {}),
  ...getAuthHeaders(await resolveAuthToken(authToken))
})
