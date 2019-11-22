import CancelError from '../errors/CancelError'
import TimeoutError from '../errors/TimeoutError'
import {CancelableThenableInterface} from '../thenable/types'

interface CancelableSignal {
  signal: Promise<never>;
  cancel: () => void;
}

export interface PollPromiseInterface<T> {
  promise: Promise<T>;
  cancel: () => void;
}

export const DEFAULT_TIMEOUT = 10000
const DEFAULT_INTERVAL = 500

const createCancellableTimedSignal = (taskName: string, ms: number): CancelableSignal => {
  const cancelable = {}

  // @ts-ignore
  cancelable.signal = new Promise((resolve, reject) => {
    // @ts-ignore
    cancelable.cancel = (): void => {
      reject(new CancelError())
    }

    // const timeoutId = setTimeout(() => {
    //   reject(new TimeoutError(taskName, ms))
    //   clearTimeout(timeoutId)
    // }, ms)
  })

  // @ts-ignore
  return cancelable
}

export default function poll<T>({
  task,
  taskName,
  condition,
  interval = DEFAULT_INTERVAL,
  timeout = DEFAULT_TIMEOUT,
  onCancel
}: {
  task: CancelableThenableInterface<T>;
  taskName: string;
  condition: (response: T) => T | boolean;
  interval?: number;
  timeout?: number;
  onCancel?: () => void;
}): PollPromiseInterface<T> {
  const { signal, cancel } = createCancellableTimedSignal(taskName, timeout)

  const promise = new Promise<T>((resolve, reject) => {
    const startTime = Number(new Date())
    const endTime = startTime + timeout

    let timeoutId = setTimeout(function tick() {
      const nowTime = Number(new Date())

      if (nowTime > endTime) {
        onCancel && onCancel()
        reject(new TimeoutError(taskName, timeout))
        clearTimeout(timeoutId)

        return
      }

      task
        .then(response => {
          if (condition(response)) {
            resolve(response)
            clearTimeout(timeoutId)

            return
          }

          timeoutId = setTimeout(tick, interval)
        })
        .catch(thrown => {
          reject(thrown)
          clearTimeout(timeoutId)

          return
        })
    }, interval)

    signal.catch(error => {
      onCancel && onCancel()
      task.cancel()
      reject(error)
      clearTimeout(timeoutId)
    })
  })

  return {
    promise,
    cancel
  }
}
