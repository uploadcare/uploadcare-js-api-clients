import info from '../api/info'
import {
  ComputableProgressInfo,
  FileInfo,
  ProgressCallback,
  Uuid
} from '../api/types'
import { CustomUserAgent, poll } from '@uploadcare/api-client-utils'

export type IsReadyPoolOptions = {
  publicKey: string
  baseURL?: string
  source?: string
  integration?: string
  userAgent?: CustomUserAgent
  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
  onProgress?: ProgressCallback<ComputableProgressInfo>
  signal?: AbortSignal
}

function isReadyPoll(
  uuid: Uuid,
  {
    publicKey,
    baseURL,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes,
    retryNetworkErrorMaxTimes,
    signal,
    onProgress
  }: IsReadyPoolOptions
): Promise<FileInfo> {
  return poll<FileInfo>({
    check: (signal) =>
      info(uuid, {
        publicKey,
        baseURL,
        signal,
        source,
        integration,
        userAgent,
        retryThrottledRequestMaxTimes,
        retryNetworkErrorMaxTimes
      }).then((response) => {
        if (response.isReady) {
          return response
        }
        onProgress && onProgress({ isComputable: true, value: 1 })
        return false
      }),
    signal
  })
}

export { isReadyPoll }
