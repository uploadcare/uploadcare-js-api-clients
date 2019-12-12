import { Uuid, GroupInfo } from './base-types'
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
  jsonpCallback?: string
  secureSignature?: string
  secureExpire?: string

  cancel?: CancelController

  source?: string // ??
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
 * Create files group.
 */

/* eslint @typescript-eslint/camelcase: [2, {allow: ["pub_key"]}] */

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
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: Options
): Promise<GroupInfo> {
  return retryIfThrottled(
    () =>
      request({
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
