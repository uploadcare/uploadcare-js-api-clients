import request from '../request/request.node'
import getUrl from '../tools/getUrl'
import defaultSettings from '../defaultSettings'
import { camelizeKeys, CustomUserAgent } from '@uploadcare/api-client-utils'
import { createUploadError } from '../tools/createUploadError'
import { retryIfFailed } from '../tools/retryIfFailed'
import { getRequestHeaders } from '../tools/getRequestHeaders'

/* Types */
import { Uuid, FileInfo } from './types'
import { FailedResponse } from '../request/types'
import { AuthToken } from '../types'

type Response = FileInfo | FailedResponse

export type InfoOptions = {
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

/** Returns a JSON dictionary holding file info. */
export default function info(
  uuid: Uuid,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    authToken,
    signal,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes
  }: InfoOptions
): Promise<FileInfo> {
  return retryIfFailed(
    async () =>
      request({
        method: 'GET',
        headers: await getRequestHeaders({
          publicKey,
          integration,
          userAgent,
          authToken
        }),
        url: getUrl(baseURL, '/info/', {
          jsonerrors: 1,
          pub_key: publicKey,
          file_id: uuid,
          source
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
      authToken
    }
  )
}
