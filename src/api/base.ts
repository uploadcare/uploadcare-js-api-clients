import request from '../request/request.node'
import getFormData from '../tools/buildFormData'
import getUrl from '../tools/getUrl'
import { defaultSettings, defaultFilename } from '../defaultSettings'
import { getUserAgent } from '../tools/userAgent'
import camelizeKeys from '../tools/camelizeKeys'
import { UploadClientError } from '../tools/errors'
import retryIfThrottled from '../tools/retryIfThrottled'

/* Types */
import { Uuid, ProgressCallback } from './types'
import { FailedResponse, NodeFile, BrowserFile } from '../request/types'

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

  signal?: AbortSignal
  onProgress?: ProgressCallback

  source?: string
  integration?: string

  retryThrottledRequestMaxTimes?: number
}

/**
 * Performs file uploading request to Uploadcare Upload API.
 * Can be canceled and has progress.
 */
function base(
  file: NodeFile | BrowserFile,
  {
    publicKey,
    fileName,
    baseURL = defaultSettings.baseURL,
    secureSignature,
    secureExpire,
    store,
    signal,
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
          ['file', file, fileName ?? (file as File).name ?? defaultFilename],
          ['UPLOADCARE_PUB_KEY', publicKey],
          [
            'UPLOADCARE_STORE',
            typeof store === 'undefined' ? 'auto' : store ? 1 : 0
          ],
          ['signature', secureSignature],
          ['expire', secureExpire],
          ['source', source]
        ]),
        signal,
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

export default base
