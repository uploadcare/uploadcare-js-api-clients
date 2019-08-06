import info from './api/info'
import {SettingsInterface} from './types'
import poll, {DEFAULT_TIMEOUT, PollPromiseInterface} from './tools/poll'
import {FileInfoInterface, Uuid} from './api/types'

type FileIsReadyParams = {
  uuid: Uuid,
  timeout?: number,
  onProgress?: Function,
  settings?: SettingsInterface
}

const checkFileIsReady = ({uuid, timeout = DEFAULT_TIMEOUT, onProgress, settings = {}}: FileIsReadyParams): PollPromiseInterface<FileInfoInterface> =>
  poll<FileInfoInterface>(
    async () => {
      const response = await info(uuid, settings)

      if (response.is_ready) {
        return response
      }

      if (typeof onProgress === 'function') {
        onProgress(response)
      }

      return false
    },
    timeout,
  )

export default checkFileIsReady
