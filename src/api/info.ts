import { Uuid, FileInfo } from './base-types'
import request from './request/request.node'
import getUrl from './request/getUrl'

import CancelController from '../CancelController'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'
import { UploadClientError } from '../errors/errors'
import retryIfThrottled from '../tools/retryIfThrottled'

type FailedResponse = {
  error: {
    content: string
    statusCode: number
  }
}

type Response = FileInfo | FailedResponse

type Options = {
  publicKey: string

  baseUrl?: string

  cancel?: CancelController

  source?: string
  integration?: string

  retryThrottledRequestMaxTimes?: number
}

/**
 * Returns a JSON dictionary holding file info.
 */

/* eslint @typescript-eslint/camelcase: [2, {allow: ["pub_key", "file_id"]}] */

export default function info(
  uuid: Uuid,
  {
    publicKey,
    baseUrl = defaultSettings.baseURL,
    cancel,
    source,
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: Options
): Promise<FileInfo> {
  return retryIfThrottled(
    () =>
      request({
        method: 'GET',
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration })
        },
        url: getUrl(baseUrl, '/info/', {
          jsonerrors: 1,
          pub_key: publicKey,
          file_id: uuid,
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
