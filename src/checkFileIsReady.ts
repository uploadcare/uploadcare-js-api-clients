import info, {InfoResponse} from './api/info'
import {Settings} from './types'
import poll, {DEFAULT_TIMEOUT, PollPromiseInterface} from './tools/poll'
import {Uuid} from './api/types'

type FileIsReadyParams = {
  uuid: Uuid,
  timeout?: number,
  onProgress?: Function,
  settings?: Settings
}

const checkFileIsReady = ({uuid, timeout = DEFAULT_TIMEOUT, onProgress, settings = {}}: FileIsReadyParams): PollPromiseInterface<InfoResponse> =>
  poll<InfoResponse>(
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
