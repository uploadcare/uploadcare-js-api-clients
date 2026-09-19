import { Uuid, GroupInfo } from './types'
import { FailedResponse } from '../request/types'
import { CustomUserAgent, camelizeKeys } from '@uploadcare/api-client-utils'

import request from '../request/request.node'
import getUrl from '../tools/getUrl'

import defaultSettings from '../defaultSettings'
import { createUploadError } from '../tools/createUploadError'
import { retryIfFailed } from '../tools/retryIfFailed'
import buildFormData from '../tools/buildFormData'
import { isAuthTokenResolver } from '../tools/resolveAuthToken'
import { getRequestHeaders } from '../tools/getRequestHeaders'
import { getSecureParams } from '../tools/getSecureParams'
import { AuthToken } from '../types'

export type GroupOptions = {
  publicKey: string

  baseURL?: string
  jsonpCallback?: string
  secureSignature?: string
  secureExpire?: string
  authToken?: AuthToken

  signal?: AbortSignal

  source?: string // ??
  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
}

type Response = GroupInfo | FailedResponse

/** Create files group. */
export default function group(
  uuids: Uuid[],
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    jsonpCallback,
    secureSignature,
    secureExpire,
    authToken,
    signal,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes
  }: GroupOptions
): Promise<GroupInfo> {
  return retryIfFailed(
    async () =>
      request({
        method: 'POST',
        headers: await getRequestHeaders({
          publicKey,
          integration,
          userAgent,
          authToken
        }),
        url: getUrl(baseURL, '/group/', {
          jsonerrors: 1
        }),
        data: buildFormData({
          files: uuids,
          callback: jsonpCallback,
          pub_key: publicKey,
          ...getSecureParams({ authToken, secureSignature, secureExpire }),
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
      retryNetworkErrorMaxTimes,
      retryThrottledRequestMaxTimes,
      canRetryExpiredToken: isAuthTokenResolver(authToken)
    }
  )
}
