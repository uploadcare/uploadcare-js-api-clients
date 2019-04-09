import {Settings} from './types'
import poll from './tools/poll'
import fromUrlStatus, {FromUrlStatusResponse, isSuccessResponse} from './api/fromUrlStatus'

type CheckFileIsUploadedParams = {
  token: string,
  timeout: number,
  settings?: Settings
}

const checkFileIsUploaded = ({token, timeout, settings = {}}: CheckFileIsUploadedParams): Promise<FromUrlStatusResponse> =>
  poll<FromUrlStatusResponse>(
    async () => {
      const response = await fromUrlStatus(token, settings)

      if (isSuccessResponse(response)) {
        return response
      }

      return false
    },
    timeout,
    150,
  )

export default checkFileIsUploaded
