import { cancelError } from './errors'
import CancelController from './CancelController'

type CheckFunction<T> = (
  cancel: CancelController | undefined
) => Promise<false | T> | false | T

const DEFAULT_INTERVAL = 500

const poll = <T>({
  check,
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

    if (cancel) {
      cancel.onCancel(() => {
        timeoutId && clearTimeout(timeoutId)
        reject(cancelError('Poll cancelled'))
      })
    }

    const tick = (): void => {
      try {
        Promise.resolve(check(cancel))
          .then((result) => {
            if (result) {
              resolve(result)
            } else {
              timeoutId = setTimeout(tick, interval)
            }
          })
          .catch((error) => reject(error))
      } catch (error) {
        reject(error)
      }
    }

    timeoutId = setTimeout(tick, 0)
  })

export { poll, CheckFunction }
