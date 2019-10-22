import {prepareOptions} from './request/prepareOptions'

/* Types */
import {Query, RequestOptionsInterface} from './request/types'
import {SettingsInterface} from '../types'
import {FileInfoInterface, ProgressStatusInterface, Token} from './types'
import {CancelableThenable} from '../thenable/CancelableThenable'
import {CancelableThenableInterface} from '../thenable/types'

export enum StatusEnum {
  Unknown = 'unknown',
  Waiting = 'waiting',
  Progress = 'progress',
  Error = 'error',
  Success = 'success'
}

type UnknownResponse = {
  status: StatusEnum.Unknown;
}

type WaitingResponse = {
  status: StatusEnum.Waiting;
}

type ProgressResponse = {
  status: StatusEnum.Progress;
} & ProgressStatusInterface

type ErrorResponse = {
  status: StatusEnum.Error;
  error: string;
}

export type SuccessResponse = {
  status: StatusEnum.Success;
} & FileInfoInterface

export type FromUrlStatusResponse = UnknownResponse | WaitingResponse | ProgressResponse | ErrorResponse | SuccessResponse

/**
 * UnknownResponse Type Guard.
 *
 * @param {FromUrlStatusResponse} response
 */
export const isUnknownResponse = (response: FromUrlStatusResponse): response is UnknownResponse => {
  return response.status !== undefined && response.status === StatusEnum.Unknown
}

/**
 * WaitingResponse Type Guard.
 *
 * @param {FromUrlStatusResponse} response
 */
export const isWaitingResponse = (response: FromUrlStatusResponse): response is WaitingResponse => {
  return response.status !== undefined && response.status === StatusEnum.Waiting
}

/**
 * UnknownResponse Type Guard.
 *
 * @param {FromUrlStatusResponse} response
 */
export const isProgressResponse = (response: FromUrlStatusResponse): response is ProgressResponse => {
  return response.status !== undefined && response.status === StatusEnum.Progress
}

/**
 * UnknownResponse Type Guard.
 *
 * @param {FromUrlStatusResponse} response
 */
export const isErrorResponse = (response: FromUrlStatusResponse): response is ErrorResponse => {
  return response.status !== undefined && response.status === StatusEnum.Error
}

/**
 * SuccessResponse Type Guard.
 *
 * @param {FromUrlStatusResponse} response
 */
export const isSuccessResponse = (response: FromUrlStatusResponse): response is SuccessResponse => {
  return response.status !== undefined && response.status === StatusEnum.Success
}

const getRequestQuery = (token: string, settings: SettingsInterface): Query => ({
  token: token,
  pub_key: settings.publicKey || '',
})

const getRequestOptions = (token: Token, settings: SettingsInterface): RequestOptionsInterface => {
  return prepareOptions({
    path: '/from_url/status/',
    query: getRequestQuery(token, settings),
  }, settings)
}

/**
 * Checking upload status and working with file tokens.
 *
 * @param {Token} token – Source file URL, which should be a public HTTP or HTTPS link.
 * @param {SettingsInterface} settings
 * @throws {UploadcareError}
 * @return {CancelableThenableInterface<FromUrlStatusResponse>}
 */
export default function fromUrlStatus(token: Token, settings: SettingsInterface = {}): CancelableThenableInterface<FromUrlStatusResponse> {
  const options = getRequestOptions(token, settings)

  return new CancelableThenable(options)
}
