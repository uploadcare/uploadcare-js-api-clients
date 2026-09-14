import { FailedResponse } from '../request/types'
import { Uuid, FileInfo } from './types'
import { CustomUserAgent, camelizeKeys } from '@uploadcare/api-client-utils'

import request from '../request/request.node'
import buildFormData from '../tools/buildFormData'
import getUrl from '../tools/getUrl'
import defaultSettings from '../defaultSettings'
import { retryIfFailed } from '../tools/retryIfFailed'
import { createUploadError } from '../tools/AuthError'
import { isAuthTokenResolver } from '../tools/getAuthHeaders'
import { getRequestHeaders } from '../tools/getRequestHeaders'
import { AuthToken } from '../types'

export type MultipartCompleteOptions = {
  publicKey: string
  baseURL?: string
  authToken?: AuthToken
  signal?: AbortSignal
  source?: string
  integration?: string
  userAgent?: CustomUserAgent
  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
}

type Response = FailedResponse | FileInfo

/** Complete multipart uploading. */
export default function multipartComplete(
  uuid: Uuid,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    authToken,
    source = 'local',
    signal,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes
  }: MultipartCompleteOptions
): Promise<FileInfo> {
  return retryIfFailed(
    async () =>
      request({
        method: 'POST',
        url: getUrl(baseURL, '/multipart/complete/', { jsonerrors: 1 }),
        headers: await getRequestHeaders({
          publicKey,
          integration,
          userAgent,
          authToken
        }),
        data: buildFormData({
          uuid: uuid,
          UPLOADCARE_PUB_KEY: publicKey,
          source: source
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
      retryThrottledRequestMaxTimes,
      retryNetworkErrorMaxTimes,
      canRetryExpiredToken: isAuthTokenResolver(authToken)
    }
  )
}
