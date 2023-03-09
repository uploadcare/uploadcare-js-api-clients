import { GroupId, GroupInfo } from './types'
import { FailedResponse } from '../request/types'
import { CustomUserAgent, camelizeKeys } from '@uploadcare/api-client-utils'

import request from '../request/request.node'
import getUrl from '../tools/getUrl'

import defaultSettings from '../defaultSettings'
import { getUserAgent } from '../tools/getUserAgent'
import { UploadClientError } from '../tools/errors'
import { retryIfFailed } from '../tools/retryIfFailed'

export type GroupInfoOptions = {
  publicKey: string
  baseURL?: string

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
    signal,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes
  }: GroupInfoOptions
): Promise<GroupInfo> {
  return retryIfFailed(
    () =>
      request({
        method: 'GET',
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration, userAgent })
        },
        url: getUrl(baseURL, '/group/info/', {
          jsonerrors: 1,
          pub_key: publicKey,
          group_id: id,
          source
        }),
        signal
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys(JSON.parse(data)) as Response

        if ('error' in response) {
          throw new UploadClientError(
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
    { retryThrottledRequestMaxTimes, retryNetworkErrorMaxTimes }
  )
}
