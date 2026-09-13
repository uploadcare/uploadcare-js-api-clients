import { Uuid, GroupInfo } from './types'
import { FailedResponse } from '../request/types'
import { CustomUserAgent, camelizeKeys } from '@uploadcare/api-client-utils'

import request from '../request/request.node'
import getUrl from '../tools/getUrl'

import defaultSettings from '../defaultSettings'
import { getUserAgent } from '../tools/getUserAgent'
import { UploadError } from '../tools/UploadError'
import { retryIfFailed } from '../tools/retryIfFailed'
import buildFormData from '../tools/buildFormData'
import { getAuthHeaders } from '../tools/getAuthHeaders'
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
        headers: {
          'X-UC-User-Agent': getUserAgent({
            publicKey,
            integration,
            userAgent
          }),
          ...(await getAuthHeaders(authToken))
        },
        url: getUrl(baseURL, '/group/', {
          jsonerrors: 1
        }),
        data: buildFormData({
          files: uuids,
          callback: jsonpCallback,
          pub_key: publicKey,
          signature: authToken ? undefined : secureSignature,
          expire: authToken ? undefined : secureExpire,
          source
        }),
        signal
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys<Response>(JSON.parse(data))

        if ('error' in response) {
          throw new UploadError(
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
      canRetryExpiredToken: typeof authToken === 'function'
    }
  )
}
