import { GroupId, GroupInfo } from './base-types'
import request from './request/request.node'
import getUrl from './request/getUrl'

import CancelController from '../CancelController'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'
import { UploadClientError } from '../errors/errors'
import retryIfThrottled from '../tools/retryIfThrottled'

type Options = {
  publicKey: string
  baseURL?: string

  cancel?: CancelController

  source?: string
  integration?: string

  retryThrottledRequestMaxTimes?: number
}

type FailedResponse = {
  error: {
    content: string
    statusCode: number
  }
}

type Response = GroupInfo | FailedResponse

/**
 * Get info about group.
 */

/* eslint @typescript-eslint/camelcase: [2, {allow: ["pub_key", "group_id"]}] */

export default function groupInfo(
  id: GroupId,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    cancel,
    source,
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: Options
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
        cancel
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
