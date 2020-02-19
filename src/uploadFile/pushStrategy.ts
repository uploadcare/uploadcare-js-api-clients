import CancelController from '../tools/CancelController'
import { UploadClientError, cancelError } from '../tools/errors'
import Pusher from './pusher'

import { FileInfo } from '../api/types'
import { Status } from '../api/fromUrlStatus'

let pusher: Pusher | null = null
const getPusher = (): Pusher => {
  if (!pusher) {
    pusher = new Pusher()
  }

  return pusher
}

const pushStrategy = ({
  token,
  cancel,
  stopRace,
  onProgress
}: {
  token: string
  cancel: CancelController
  stopRace: () => void
  onProgress?: (info: { value: number }) => void
}): Promise<FileInfo | UploadClientError> =>
  new Promise((resolve, reject) => {
    const pusher = getPusher()

    cancel.onCancel(() => {
      pusher.unsubscribe(token)
      reject(cancelError('pisher cancelled'))
    })

    pusher.error(reject)

    pusher.subscribe(token, result => {
      stopRace()

      switch (result.status) {
        case Status.Success: {
          pusher.unsubscribe(token)
          if (onProgress) onProgress({ value: result.done / result.total })
          resolve(result)
          break
        }

        case Status.Progress: {
          if (onProgress) {
            onProgress({ value: result.done / result.total })
          }
          break
        }

        case Status.Error: {
          pusher.unsubscribe(token)
          reject(new UploadClientError(result.msg))
        }
      }
    })
  })

const preconnect = (): void => {
  getPusher().connect()
}

export default pushStrategy
export { preconnect, pushStrategy }
