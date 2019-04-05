import info, {InfoResponse} from './api/info'
import {Settings} from './types'
import poll from './tools/poll'

type CheckFileIsReadyParams = {
  uuid: string,
  timeout: number,
  settings?: Settings
}

const checkFileIsReady = ({uuid, timeout, settings = {}}: CheckFileIsReadyParams): Promise<InfoResponse> =>
  poll<InfoResponse>(
    async () => {
      const response = await info(uuid, settings)

      if (response.is_ready) {
        return response
      }

      return false
    },
    timeout,
    150
  )

export default checkFileIsReady
