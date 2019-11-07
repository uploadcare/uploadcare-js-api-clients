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

const createCancellableTimedSignal = (taskName, timeoutMs): CancelableSignal => {
  const cancelable = {}

  // @ts-ignore
  cancelable.signal = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(taskName, timeoutMs))
    }, timeoutMs)

    // @ts-ignore
    cancelable.cancel = (): void => {
      reject(new CancelError())
    }
  })

  // @ts-ignore
  return cancelable
}

export default function poll<T>({
  task,
  taskName,
  condition,
  interval = DEFAULT_INTERVAL,
  timeout = DEFAULT_TIMEOUT
}: {
  task: CancelableThenableInterface<T>;
  taskName: string;
  condition: (response: T) => T | boolean;
  interval?: number;
  timeout?: number;
}): PollPromiseInterface<T> {
  const { signal, cancel } = createCancellableTimedSignal(taskName, timeout)

  const promise = new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    let intervalId = setTimeout(async function tick() {
      try {
        const response = await task

        if (condition(response)) {
          resolve(response)
          clearInterval(intervalId)
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        intervalId = setTimeout(tick, interval) // (*)
      } catch (thrown) {
        reject(thrown)
        clearInterval(intervalId)
      }
    }, interval)

    signal.catch(error => {
      reject(error)
      clearInterval(intervalId)
      task.cancel()
    })
  })

  return {
    // @ts-ignore
    promise,
    cancel
  }
}
