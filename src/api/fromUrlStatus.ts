import { FileInfo, Token } from './types'
import { FailedResponse } from '../request/types'

import request from '../request/request.node'
import getUrl from '../tools/getUrl'

import defaultSettings from '../defaultSettings'
import { getUserAgent } from '../tools/userAgent'
import CancelController from '../tools/CancelController'
import camelizeKeys from '../tools/camelizeKeys'
import { UploadClientError } from '../tools/errors'
import retryIfThrottled from '../tools/retryIfThrottled'

export enum Status {
  Unknown = 'unknown',
  Waiting = 'waiting',
  Progress = 'progress',
  Error = 'error',
  Success = 'success'
}

type StatusUnknownResponse = {
  status: Status.Unknown
}

type StatusWaitingResponse = {
  status: Status.Waiting
}

type StatusProgressResponse = {
  status: Status.Progress
  size: number
  done: number
  total: number
}

type StatusErrorResponse = {
  status: Status.Error
  error: string
}

type StatusSuccessResponse = {
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

  cancel?: CancelController

  integration?: string

  retryThrottledRequestMaxTimes?: number
}

/**
 * Checking upload status and working with file tokens.
 */
export default function fromUrlStatus(
  token: Token,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    cancel,
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: FromUrlStatusOptions = {}
): Promise<FromUrlStatusResponse> {
  return retryIfThrottled(
    () =>
      request({
        method: 'GET',
        headers: publicKey
          ? { 'X-UC-User-Agent': getUserAgent({ publicKey, integration }) }
          : undefined,
        url: getUrl(baseURL, '/from_url/status/', {
          jsonerrors: 1,
          token
        }),
        cancel
      }).then(({ data, headers, request }) => {
        const response = camelizeKeys<Response>(JSON.parse(data))

        if ('error' in response && !isErrorResponse(response)) {
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
