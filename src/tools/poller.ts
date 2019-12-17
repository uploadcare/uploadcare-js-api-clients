import { cancelError, UploadClientError } from '../../src/errors/errors'

import CancelController from '../CancelController'

type CheckFunction<T> = (
  cancel: CancelController | undefined
) => Promise<false | T> | false | T

const DEFAULT_TIMEOUT = 10000
const DEFAULT_INTERVAL = 500

const poller = <T>({
  check,
  timeout = DEFAULT_TIMEOUT,
  interval = DEFAULT_INTERVAL,
  cancel
}: {
  check: CheckFunction<T>
  timeout?: number
  interval?: number
  cancel?: CancelController
}): Promise<T> =>
  new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout
    const startTime = Date.now()
    const endTime = startTime + timeout

    if (cancel) {
      cancel.onCancel(() => {
        timeoutId && clearTimeout(timeoutId)
        reject(cancelError('Poll canceled'))
      })
    }

    const tick = (): void => {
      try {
        Promise.resolve(check(cancel))
          .then(result => {
            const nowTime = Date.now()

            if (result) {
              resolve(result)
            } else if (nowTime > endTime) {
              reject(new UploadClientError('Poll Timeout'))
            } else {
              timeoutId = setTimeout(tick, interval)
            }
          })
          .catch(error => reject(error))
      } catch (error) {
        reject(error)
      }
    }

    timeoutId = setTimeout(tick, 0)
  })

export { poller as poll, CheckFunction }
