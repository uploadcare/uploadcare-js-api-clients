import request, {prepareOptions, RequestOptions} from './request'
import {Settings} from '../types'
import {FileInfo, ProgressStatus} from './types'

export enum StatusEnum {
  Unknown = 'unknown',
  Progress = 'progress',
  Error = 'error',
  Success = 'success'
}

type UnknownResponse = {
  status: StatusEnum.Unknown
}

type ProgressResponse = ProgressStatus & {
  status: StatusEnum.Progress
}

type ErrorResponse = {
  status: StatusEnum.Error,
  error: string,
}

type SuccessResponse = {
  status: StatusEnum.Success,
} & FileInfo

export type FromUrlStatusResponse = UnknownResponse | ProgressResponse | ErrorResponse | SuccessResponse

/**
 * UnknownResponse Type Guard
 * @param {FromUrlStatusResponse} response
 */
export const isUnknownResponse = (response: FromUrlStatusResponse): response is UnknownResponse => {
  return response.status !== undefined && response.status === StatusEnum.Unknown;
}

/**
 * UnknownResponse Type Guard
 * @param {FromUrlStatusResponse} response
 */
export const isProgressResponse = (response: FromUrlStatusResponse): response is ProgressResponse => {
  return response.status !== undefined && response.status === StatusEnum.Progress;
}

/**
 * UnknownResponse Type Guard
 * @param {FromUrlStatusResponse} response
 */
export const isErrorResponse = (response: FromUrlStatusResponse): response is ErrorResponse => {
  return response.status !== undefined && response.status === StatusEnum.Error;
}

/**
 * SuccessResponse Type Guard
 * @param {FromUrlStatusResponse} response
 */
export const isSuccessResponse = (response: FromUrlStatusResponse): response is SuccessResponse => {
  return response.status !== undefined && response.status === StatusEnum.Success;
}

const getRequestQuery = (token: string, settings: Settings) => ({
  token: token,
  pub_key: settings.publicKey || '',
})

const getRequestOptions = (token: string, settings: Settings): RequestOptions => {
  return prepareOptions({
    path: '/from_url/status/',
    query: getRequestQuery(token, settings),
  }, settings)
}

/**
 * Checking upload status and working with file tokens.
 *
 * @param {string} token – Source file URL, which should be a public HTTP or HTTPS link.
 * @param {Settings} settings
 * @throws {UploadcareError}
 * @return {Promise<FromUrlStatusResponse>}
 */
export default function fromUrlStatus(token: string, settings: Settings = {}): Promise<FromUrlStatusResponse> {
  const options = getRequestOptions(token, settings)

  return request(options)
    .then(response => response.data)
}
