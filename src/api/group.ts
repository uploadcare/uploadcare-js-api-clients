import { Uuid, GroupInfo } from './base-types'
import request from './request/request.node'
import getUrl from './request/getUrl'

import CancelController from '../CancelController'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'

type Options = {
  publicKey: string

  baseURL?: string
  jsonpCallback?: string
  secureSignature?: string
  secureExpire?: string

  cancel?: CancelController

  source?: string // ??
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
 * Create files group.
 */
export default function group(
  uuids: Uuid[],
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    jsonpCallback,
    secureSignature,
    secureExpire,
    cancel,
    source,
    integration
  }: Options
): Promise<GroupInfo> {
  return request({
    method: 'POST',
    headers: {
      'X-UC-User-Agent': getUserAgent({ publicKey, integration })
    },
    url: getUrl(baseURL, '/group/', {
      jsonerrors: 1,
      pub_key: publicKey,
      files: uuids,
      callback: jsonpCallback,
      signature: secureSignature,
      expire: secureExpire,
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
