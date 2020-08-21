import { GroupId, GroupInfo } from './types'
import { FailedResponse } from '../request/types'

import request from '../request/request.node'
import getUrl from '../tools/getUrl'

import defaultSettings from '../defaultSettings'
import { getUserAgent } from '../tools/userAgent'
import camelizeKeys from '../tools/camelizeKeys'
import { UploadClientError } from '../tools/errors'
import retryIfThrottled from '../tools/retryIfThrottled'

export type GroupInfoOptions = {
  publicKey: string
  baseURL?: string

  signal?: AbortSignal

  source?: string
  integration?: string

  retryThrottledRequestMaxTimes?: number
}

type Response = GroupInfo | FailedResponse

/**
 * Get info about group.
 */

/* eslint @typescript-eslint/camelcase: [2, {allow: ["pub_key", "group_id"]}] */

function groupInfo(
  id: GroupId,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    signal,
    source,
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: GroupInfoOptions
): Promise<GroupInfo> {
  return retryIfThrottled(
    () =>
      request({
        method: 'GET',
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration })
        },
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
          throw new UploadClientError(
            `[${response.error.statusCode}] ${response.error.content}`,
            request,
            response.error,
            headers
          )
        } else {
          return response
        }
      }),
    retryThrottledRequestMaxTimes
  )
}

export default groupInfo
