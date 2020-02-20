import CancelController from '../tools/CancelController'
import { UploadClientError, cancelError } from '../tools/errors'
import Pusher from './pusher'

import { FileInfo } from '../api/types'
import { Status } from '../api/fromUrlStatus'

let pusher: Pusher | null = null
const getPusher = (key: string): Pusher => {
  if (!pusher) {
    pusher = new Pusher(key)
  }

  return pusher
}

const pushStrategy = ({
  token,
  pusherKey,
  cancel,
  stopRace,
  onProgress
}: {
  token: string
  pusherKey: string
  cancel: CancelController
  stopRace: () => void
  onProgress?: (info: { value: number }) => void
}): Promise<FileInfo | UploadClientError> =>
  new Promise((resolve, reject) => {
    const pusher = getPusher(pusherKey)
    const unsubErrorHandler = pusher.onError(reject)

    cancel.onCancel(() => {
      unsubErrorHandler()
      pusher.unsubscribe(token)
      reject(cancelError('pisher cancelled'))
    })

    pusher.subscribe(token, result => {
      stopRace()

      switch (result.status) {
        case Status.Success: {
          unsubErrorHandler()
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
          unsubErrorHandler()
          pusher.unsubscribe(token)
          reject(new UploadClientError(result.msg))
        }
      }
    })
  })

const preconnect = (key: string): void => {
  getPusher(key).connect()
}

export default pushStrategy
export { preconnect, pushStrategy }
