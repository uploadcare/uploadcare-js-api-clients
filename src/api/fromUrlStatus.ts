import { FileInfo, Token } from './types'
import request from './request/request.node'
import getUrl from './request/getUrl'

import defaultSettings, { getUserAgent } from '../defaultSettings'
import CancelController from '../CancelController'
import camelizeKeys from '../tools/camelizeKeys'

export enum Status {
  Unknown = 'unknown',
  Waiting = 'waiting',
  Progress = 'progress',
  Error = 'error',
  Success = 'success'
}

type UnknownResponse = {
  status: Status.Unknown
}

type WaitingResponse = {
  status: Status.Waiting
}

type ProgressResponse = {
  status: Status.Progress
  size: number
  done: number
  total: number
}

type ErrorResponse = {
  status: Status.Error
  error: string
}

type SuccessResponse = {
  status: Status.Success
} & FileInfo

export type FromUrlStatusResponse =
  | UnknownResponse
  | WaitingResponse
  | ProgressResponse
  | ErrorResponse
  | SuccessResponse

type FailedResponse = {
  error: {
    content: string
    statusCode: number
  }
}

type Response = FromUrlStatusResponse | FailedResponse

/**
 * UnknownResponse Type Guard.
 */
export const isUnknownResponse = (
  response: FromUrlStatusResponse
): response is UnknownResponse => {
  return response.status !== undefined && response.status === Status.Unknown
}

/**
 * WaitingResponse Type Guard.
 */
export const isWaitingResponse = (
  response: FromUrlStatusResponse
): response is WaitingResponse => {
  return response.status !== undefined && response.status === Status.Waiting
}

/**
 * UnknownResponse Type Guard.
 */
export const isProgressResponse = (
  response: FromUrlStatusResponse
): response is ProgressResponse => {
  return response.status !== undefined && response.status === Status.Progress
}

/**
 * UnknownResponse Type Guard.
 */
export const isErrorResponse = (
  response: Response
): response is ErrorResponse => {
  return 'status' in response && response.status === Status.Error
}

/**
 * SuccessResponse Type Guard.
 */
export const isSuccessResponse = (
  response: FromUrlStatusResponse
): response is SuccessResponse => {
  return response.status !== undefined && response.status === Status.Success
}

export type FromUrlStatusOptions = {
  publicKey?: string

  baseURL?: string

  cancel?: CancelController

  integration?: string
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
    integration
  }: FromUrlStatusOptions = {}
): Promise<FromUrlStatusResponse> {
  return request({
    method: 'GET',
    headers: publicKey
      ? { 'X-UC-User-Agent': getUserAgent({ publicKey, integration }) }
      : undefined,
    url: getUrl(baseURL, '/from_url/status/', {
      jsonerrors: 1,
      token
    }),
    cancel
  })
    .then(response => camelizeKeys<Response>(JSON.parse(response.data)))
    .then(response => {
      if ('error' in response && !isErrorResponse(response)) {
        throw new Error(
          `[${response.error.statusCode}] ${response.error.content}`
        )
      }

      return response
    })
}
