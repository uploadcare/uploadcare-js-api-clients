import getFormData from './request/buildFormData.node'
import request from './request/request.node'
import getUrl from './request/getUrl'
import CancelController from '../CancelController'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'
import { UploadClientError } from '../errors/errors'
import retryIfThrottled from '../tools/retryIfThrottled'

/* Types */
import { FileData, Uuid } from './types'
import { FailedResponse } from './request/types'

export type BaseResponse = {
  file: Uuid
}

type Response = BaseResponse | FailedResponse

export type BaseOptions = {
  publicKey: string

  fileName?: string
  baseURL?: string
  secureSignature?: string
  secureExpire?: string
  store?: boolean

  cancel?: CancelController
  onProgress?: ({ value: number }) => void

  source?: string
  integration?: string

  retryThrottledRequestMaxTimes?: number
}

/**
 * Performs file uploading request to Uploadcare Upload API.
 * Can be canceled and has progress.
 */
export default function base(
  file: FileData,
  {
    publicKey,
    fileName,
    baseURL = defaultSettings.baseURL,
    secureSignature,
    secureExpire,
    store,
    cancel,
    onProgress,
    source = 'local',
    integration,
    retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes
  }: BaseOptions
): Promise<BaseResponse> {
  return retryIfThrottled(
    () =>
      request({
        method: 'POST',
        url: getUrl(baseURL, '/base/', {
          jsonerrors: 1
        }),
        headers: {
          'X-UC-User-Agent': getUserAgent({ publicKey, integration })
        },
        data: getFormData([
          [
            'file',
            file,
            fileName || (file as File).name || defaultSettings.fileName
          ],
          ['UPLOADCARE_PUB_KEY', publicKey],
          [
            'UPLOADCARE_STORE',
            typeof store === 'undefined' ? 'auto' : store ? 1 : 0
          ],
          ['signature', secureSignature],
          ['expire', secureExpire],
          ['source', source]
        ]),
        cancel,
        onProgress
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
