import { GroupId, GroupInfo } from './types'
import request from './request/request.node'
import getUrl from './request/getUrl'

import CancelController from '../CancelController'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'

export type GroupInfoOptions = {
  publicKey: string
  baseURL?: string

  cancel?: CancelController

  source?: string
  integration?: string
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
export default function groupInfo(
  id: GroupId,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    cancel,
    source,
    integration
  }: GroupInfoOptions
): Promise<GroupInfo> {
  return request({
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
  })
    .then(response => camelizeKeys<Response>(JSON.parse(response.data)))
    .then(response => {
      if ('error' in response) {
        throw new Error(
          `[${response.error.statusCode}] ${response.error.content}`
        )
      }

      return response
    })
}
