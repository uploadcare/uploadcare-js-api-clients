import {Settings} from './types'
import poll, {PollPromiseInterface} from './tools/poll'
import fromUrlStatus, {FromUrlStatusResponse, isSuccessResponse} from './api/fromUrlStatus'

type CheckFileIsUploadedParams = {
  token: string,
  timeout: number,
  onProgress?: Function,
  settings?: Settings
}

const checkFileIsUploadedFromUrl = ({token, timeout, onProgress, settings = {}}: CheckFileIsUploadedParams): PollPromiseInterface<FromUrlStatusResponse> =>
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
    150,
  )

export default checkFileIsUploadedFromUrl
