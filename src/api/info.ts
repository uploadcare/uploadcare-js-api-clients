import request from './request/request.node'
import getUrl from './request/getUrl'
import CancelController from '../CancelController'
import defaultSettings, { getUserAgent } from '../defaultSettings'
import camelizeKeys from '../tools/camelizeKeys'

/* Types */
import { Uuid, FileInfo } from './types'

type FailedResponse = {
  error: {
    content: string
    statusCode: number
  }
}

type Response = FileInfo | FailedResponse

export type InfoOptions = {
  publicKey: string

  baseURL?: string

  cancel?: CancelController

  source?: string
  integration?: string
}

/**
 * Returns a JSON dictionary holding file info.
 */
export default function info(
  uuid: Uuid,
  {
    publicKey,
    baseURL = defaultSettings.baseURL,
    cancel,
    source,
    integration
  }: InfoOptions
): Promise<FileInfo> {
  return request({
    method: 'GET',
    headers: {
      'X-UC-User-Agent': getUserAgent({ publicKey, integration })
    },
    url: getUrl(baseURL, '/info/', {
      jsonerrors: 1,
      pub_key: publicKey,
      file_id: uuid,
      source
    }),
    cancel
  })
    .then(response => camelizeKeys<Response>(JSON.parse(response.data)))
    .then(response => {
      if ('error' in response) {
        throw new Error(
          `[${response.error.statusCode}] ${response.error.content}`
        )
      }

      return response
    })
}
