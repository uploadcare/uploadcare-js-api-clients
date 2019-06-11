import {Settings} from './types'
import poll, {DEFAULT_TIMEOUT, PollPromiseInterface} from './tools/poll'
import fromUrlStatus, {FromUrlStatusResponse, isSuccessResponse} from './api/fromUrlStatus'
import {Uuid} from './api/types'

type CheckFileIsUploadedParams = {
  token: Uuid,
  timeout?: number,
  onProgress?: Function,
  settings?: Settings
}

const checkFileIsUploadedFromUrl = ({token, timeout = DEFAULT_TIMEOUT, onProgress, settings = {}}: CheckFileIsUploadedParams): PollPromiseInterface<FromUrlStatusResponse> =>
  poll<FromUrlStatusResponse>(
    async () => {
      const response = await fromUrlStatus(token, settings)

      if (isSuccessResponse(response)) {
        return response
      }

      if (onProgress && typeof onProgress === 'function') {
        onProgress(response)
      }

      return false
    },
    timeout,
  )

export default checkFileIsUploadedFromUrl
