import info from './api/info'
import { SettingsInterface } from './types'
import poll, { PollPromiseInterface } from './tools/poll'
import { FileInfoInterface, Uuid } from './api/types'
import defaultSettings from './defaultSettings'

type FileIsReadyParams = {
  uuid: Uuid
  timeout?: number
  onProgress?: Function
  settings?: SettingsInterface
}

const checkFileIsReady = ({
  uuid,
  timeout = defaultSettings.pollingTimeoutMilliseconds,
  onProgress,
  settings = {}
}: FileIsReadyParams): PollPromiseInterface<FileInfoInterface> =>
  poll<FileInfoInterface>(async () => {
    const response = await info(uuid, settings)

    if (response.is_ready) {
      return response
    }

    if (typeof onProgress === 'function') {
      onProgress(response)
    }

    return false
  }, timeout)

export default checkFileIsReady
