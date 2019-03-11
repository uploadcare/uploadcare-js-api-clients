import request, {prepareOptions} from './request'
import {RequestOptions} from './request'
import {Settings} from '../types'
import {FileInfo, ProgressStatus} from './types'

type ProgressResponse = ProgressStatus & {
  status: StatusEnum.Progress
}

export enum StatusEnum {
  Unknown = 'unknown',
  Progress = 'progress',
  Error = 'error',
  Success = 'success'
}

type InfoResponse = FileInfo & {
  status: StatusEnum.Success,
}

type ErrorResponse = {
  status: StatusEnum.Error,
  error: string,
}

export type FromUrlStatusResponse = ProgressResponse | InfoResponse | ErrorResponse

/**
 * Checking upload status and working with file tokens.
 *
 * @param {string} token – Source file URL, which should be a public HTTP or HTTPS link.
 * @param {Settings} settings
 * @throws {UploadcareError}
 * @return {Promise<FromUrlStatusResponse>}
 */
export default function fromUrlStatus(token: string, settings: Settings = {}): Promise<FromUrlStatusResponse> {
  const options: RequestOptions = prepareOptions({
    path: '/from_url/status/',
    query: {token: token},
  }, settings)

  return request(options)
    .then(response => response.data)
}
