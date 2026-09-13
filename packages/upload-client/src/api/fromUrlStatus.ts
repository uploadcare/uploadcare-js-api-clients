import { FileInfo, Token } from './types'
import { FailedResponse } from '../request/types'
import { CustomUserAgent, camelizeKeys } from '@uploadcare/api-client-utils'

import request from '../request/request.node'
import getUrl from '../tools/getUrl'

import defaultSettings from '../defaultSettings'
import { getUserAgent } from '../tools/getUserAgent'
import { UploadError } from '../tools/UploadError'
import { retryIfFailed } from '../tools/retryIfFailed'
import { ServerErrorCode } from '../tools/ServerErrorCode'
import { getAuthHeaders } from '../tools/getAuthHeaders'
import { AuthToken } from '../types'

export enum Status {
  Unknown = 'unknown',
  Waiting = 'waiting',
  Progress = 'progress',
  Error = 'error',
  Success = 'success'
}

export type StatusUnknownResponse = {
  status: Status.Unknown
}

export type StatusWaitingResponse = {
  status: Status.Waiting
}

export type StatusProgressResponse = {
  status: Status.Progress
  size: number
  done: number
  total: number | 'unknown'
}

export type StatusErrorResponse = {
  status: Status.Error
  error: string
  errorCode: ServerErrorCode
}

export type StatusSuccessResponse = {
  status: Status.Success
} & FileInfo

export type FromUrlStatusResponse =
  | StatusUnknownResponse
  | StatusWaitingResponse
  | StatusProgressResponse
  | StatusErrorResponse
  | StatusSuccessResponse

type Response = FromUrlStatusResponse | FailedResponse

const isErrorResponse = (
  response: Response
): response is StatusErrorResponse => {
  return 'status' in response && response.status === Status.Error
}

export type FromUrlStatusOptions = {
  publicKey?: string

  baseURL?: string
  authToken?: AuthToken

  signal?: AbortSignal

  integration?: string
  userAgent?: CustomUserAgent

  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
}

/** Checking upload status and working with file tokens. */
export default function fromUrlStatus(
  token: Token,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    authToken,
    signal,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes
  }: FromUrlStatusOptions = {}
): Promise<FromUrlStatusResponse> {
  return retryIfFailed(
    async () =>
      request({
        method: 'GET',
        headers: {
          ...(publicKey
            ? {
                'X-UC-User-Agent': getUserAgent({
                  publicKey,
                  integration,
                  userAgent
                })
              }
            : {}),
          ...(await getAuthHeaders(authToken))
        },
        url: getUrl(baseURL, '/from_url/status/', {
          jsonerrors: 1,
          token
        }),
        signal
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys<Response>(JSON.parse(data))

        if ('error' in response && !isErrorResponse(response)) {
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
    {
      retryNetworkErrorMaxTimes,
      retryThrottledRequestMaxTimes,
      canRetryExpiredToken: typeof authToken === 'function'
    }
  )
}
