import { onCancel } from './onCancel'
import { CancelError } from './CancelError'

type PollCheckFunction<T> = (
  signal?: AbortSignal
) => Promise<false | T> | false | T

const DEFAULT_INTERVAL = 500

const poll = <T>({
  check,
  interval = DEFAULT_INTERVAL,
  timeout,
  signal
}: {
  check: PollCheckFunction<T>
  timeout?: number
  interval?: number
  signal?: AbortSignal
}): Promise<T> =>
  new Promise((resolve, reject) => {
    let tickTimeoutId: NodeJS.Timeout
    let timeoutId: NodeJS.Timeout

    onCancel(signal, () => {
      tickTimeoutId && clearTimeout(tickTimeoutId)
      reject(new CancelError('Poll cancelled'))
    })

    if (timeout) {
      timeoutId = setTimeout(() => {
        tickTimeoutId && clearTimeout(tickTimeoutId)
        reject(new CancelError('Timed out'))
      }, timeout)
    }

    const tick = (): void => {
      try {
        Promise.resolve(check(signal))
          .then((result) => {
            if (result) {
              timeoutId && clearTimeout(timeoutId)
              resolve(result)
            } else {
              tickTimeoutId = setTimeout(tick, interval)
            }
          })
          .catch((error) => {
            timeoutId && clearTimeout(timeoutId)
            reject(error)
          })
      } catch (error) {
        timeoutId && clearTimeout(timeoutId)
        reject(error)
      }
    }

    tickTimeoutId = setTimeout(tick, 0)
  })

export { poll, PollCheckFunction }
