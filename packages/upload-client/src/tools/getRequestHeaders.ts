import { CustomUserAgent } from '@uploadcare/api-client-utils'
import { Headers } from '../request/types'
import { AuthToken } from '../types'
import { getAuthHeaders } from './getAuthHeaders'
import { getUserAgent } from './getUserAgent'

type GetRequestHeadersOptions = {
  publicKey?: string
  integration?: string
  userAgent?: CustomUserAgent
  authToken?: AuthToken
}

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
  ...(await getAuthHeaders(authToken))
})
