import { GroupId, GroupInfo } from './types'
import { FailedResponse } from '../request/types'
import { CustomUserAgent, camelizeKeys } from '@uploadcare/api-client-utils'

import request from '../request/request.node'
import getUrl from '../tools/getUrl'

import defaultSettings from '../defaultSettings'
import { createUploadError } from '../tools/AuthError'
import { retryIfFailed } from '../tools/retryIfFailed'
import { isAuthTokenResolver } from '../tools/getAuthHeaders'
import { getRequestHeaders } from '../tools/getRequestHeaders'
import { AuthToken } from '../types'

export type GroupInfoOptions = {
  publicKey: string
  baseURL?: string
  authToken?: AuthToken

  signal?: AbortSignal

  source?: string
  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
}

type Response = GroupInfo | FailedResponse

/** Get info about group. */
export default function groupInfo(
  id: GroupId,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    authToken,
    signal,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes
  }: GroupInfoOptions
): Promise<GroupInfo> {
  return retryIfFailed(
    async () =>
      request({
        method: 'GET',
        headers: await getRequestHeaders({
          publicKey,
          integration,
          userAgent,
          authToken
        }),
        url: getUrl(baseURL, '/group/info/', {
          jsonerrors: 1,
          pub_key: publicKey,
          group_id: id,
          source
        }),
        signal
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys<Response>(JSON.parse(data))

        if ('error' in response) {
          throw createUploadError(
            response.error.content,
            response.error.errorCode,
            request,
            response,
            headers
          )
        } else {
          return response
        }
      }),
    {
      retryThrottledRequestMaxTimes,
      retryNetworkErrorMaxTimes,
      canRetryExpiredToken: isAuthTokenResolver(authToken)
    }
  )
}
