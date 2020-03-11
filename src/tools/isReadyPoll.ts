import info from '../api/info'
import { poll } from './poll'
import { FileInfo } from '../api/types'
import CancelController from './CancelController'

type ArgsIsReadyPool = {
  file: string
  publicKey: string
  baseURL?: string
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
  onProgress?: (args: { value: number }) => void
  cancel?: CancelController
}

function isReadyPoll({
  file,
  publicKey,
  baseURL,
  source,
  integration,
  retryThrottledRequestMaxTimes,
  cancel,
  onProgress
}: ArgsIsReadyPool): FileInfo | PromiseLike<FileInfo> {
  return poll<FileInfo>({
    check: cancel =>
      info(file, {
        publicKey,
        baseURL,
        cancel,
        source,
        integration,
        retryThrottledRequestMaxTimes
      }).then(response => {
        if (response.isReady) {
          return response
        }
        onProgress && onProgress({ value: 1 })
        return false
      }),
    cancel
  })
}

export { isReadyPoll }
