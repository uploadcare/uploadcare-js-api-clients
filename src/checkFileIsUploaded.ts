import {Settings} from './types'
import poll from './tools/poll'
import fromUrlStatus, {FromUrlStatusResponse, isSuccessResponse} from './api/fromUrlStatus'

type CheckFileIsUploadedParams = {
  token: string,
  timeout: number,
  onProgress?: Function,
  settings?: Settings
}

const checkFileIsUploaded = ({token, timeout, onProgress, settings = {}}: CheckFileIsUploadedParams): Promise<FromUrlStatusResponse> =>
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

export default checkFileIsUploaded
