import info from '../api/info'
import { poll } from './poll'
import { FileInfo } from '../api/types'

type ArgsIsReadyPool = {
  file: string
  publicKey: string
  baseURL?: string
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
  onProgress?: (args: { value: number }) => void
  signal?: AbortSignal
}

function isReadyPoll({
  file,
  publicKey,
  baseURL,
  source,
  integration,
  retryThrottledRequestMaxTimes,
  signal,
  onProgress
}: ArgsIsReadyPool): FileInfo | PromiseLike<FileInfo> {
  return poll<FileInfo>({
    check: signal =>
      info(file, {
        publicKey,
        baseURL,
        signal,
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
    signal
  })
}

export { isReadyPoll }
