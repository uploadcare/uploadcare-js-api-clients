import { FailedResponse } from './request/types'
import { Uuid, FileInfo } from './types'

import request from './request/request.node'
import getFormData from './request/buildFormData.node'
import getUrl from './request/getUrl'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'
import retryIfThrottled from '../tools/retryIfThrottled'
import { UploadClientError } from '../errors/errors'
import CancelController from '../CancelController'

export type MultipartCompleteOptions = {
  publicKey: string
  baseURL?: string
  cancel?: CancelController
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
}

type Response = FailedResponse | FileInfo

/**
 * Complete multipart uploading.
 */
export default function multipartComplete(
  uuid: Uuid,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    source = 'local',
    cancel,
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: MultipartCompleteOptions
): Promise<FileInfo> {
  return retryIfThrottled(
    () =>
      request({
        method: 'POST',
        url: getUrl(baseURL, '/multipart/complete/', { jsonerrors: 1 }),
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration })
        },
        data: getFormData([
          ['uuid', uuid],
          ['UPLOADCARE_PUB_KEY', publicKey],
          ['source', source]
        ]),
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
