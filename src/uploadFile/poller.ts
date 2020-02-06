import fromUrlStatus, { Status } from '../api/fromUrlStatus'
import { poll } from '../tools/poll'
import { UploadClientError } from '../tools/errors'
import { FileInfo } from '../api/types'
import CancelController from '../tools/CancelController'

function realPoll({
  token,
  publicKey,
  baseURL,
  integration,
  retryThrottledRequestMaxTimes,
  onProgress,
  cancel
}: {
  token: string
  publicKey: string
  baseURL?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
  onProgress?: (info: { value: number }) => void
  cancel?: CancelController
}): Promise<FileInfo> {
  return poll<FileInfo>({
    check: cancel =>
      fromUrlStatus(token, {
        publicKey,
        baseURL,
        integration,
        retryThrottledRequestMaxTimes,
        cancel
      }).then(response => {
        switch (response.status) {
          case Status.Error: {
            throw new UploadClientError(response.error)
          }
          case Status.Waiting: {
            return false
          }
          case Status.Unknown: {
            throw new UploadClientError(`Token "${token}" was not found.`)
          }
          case Status.Progress: {
            if (onProgress)
              onProgress({ value: response.done / response.total })
            return false
          }
          case Status.Success: {
            if (onProgress)
              onProgress({ value: response.done / response.total })
            return response
          }
          default: {
            throw new UploadClientError('Unknown status')
          }
        }
      }),
    cancel
  })
}

export default realPoll
