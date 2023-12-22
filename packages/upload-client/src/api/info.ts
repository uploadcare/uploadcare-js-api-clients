import request from '../request/request.node'
import getUrl from '../tools/getUrl'
import defaultSettings from '../defaultSettings'
import { getUserAgent } from '../tools/getUserAgent'
import { camelizeKeys, CustomUserAgent } from '@uploadcare/api-client-utils'
import { UploadError } from '../tools/UploadError'
import { retryIfFailed } from '../tools/retryIfFailed'

/* Types */
import { Uuid, FileInfo } from './types'
import { FailedResponse } from '../request/types'

type Response = FileInfo | FailedResponse

export type InfoOptions = {
  publicKey: string

  baseURL?: string

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
    signal,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes
  }: InfoOptions
): Promise<FileInfo> {
  return retryIfFailed(
    () =>
      request({
        method: 'GET',
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration, userAgent })
        },
        url: getUrl(baseURL, '/info/', {
          jsonerrors: 1,
          pub_key: publicKey,
          file_id: uuid,
          source
        }),
        signal
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys(JSON.parse(data)) as Response

        if ('error' in response) {
          throw new UploadError(
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
