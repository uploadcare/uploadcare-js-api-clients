import CancelError from '../errors/CancelError'
import TimeoutError from '../errors/TimeoutError'

type ExecutorFunction = {
  (resolve: Function, reject: Function): void;
}

interface CancelableSignal {
  signal: Promise<never>;
  cancel: () => void
}

export interface PollPromiseInterface<T> {
  promise: Promise<T>;
  cancel: () => void
}

export const DEFAULT_TIMEOUT = 10000
const DEFAULT_INTERVAL = 500

function createCancellableSignal(): CancelableSignal {
  const ret = {}

  // @ts-ignore
  ret.signal = new Promise((resolve, reject) => {
    // @ts-ignore
    ret.cancel = () => {
      reject(new CancelError())
    }
  })

  // @ts-ignore
  return ret
}

export default function poll<T>(
  checkConditionFunction: Function,
  timeout: number = DEFAULT_TIMEOUT,
  interval: number = DEFAULT_INTERVAL
): PollPromiseInterface<T> {
  const startTime = Number(new Date())
  const endTime = startTime + timeout
  const {signal, cancel} = createCancellableSignal()

  const checkCondition: ExecutorFunction = async (resolve, reject) => {
    // If the condition is met, we're done!
    try {
      const result = await checkConditionFunction()
      const nowTime = Number(new Date())

      if (result) {
        resolve(result)
      }
      // If the condition isn't met but the timeout hasn't elapsed, go again
      else if (nowTime < endTime) {
        setTimeout(checkCondition, interval, resolve, reject)
      }
      // Didn't match and too much time, reject!
      else {
        // TODO: Pass function name as param
        reject(new TimeoutError('', timeout))
      }

      signal.catch(error => {
        reject(error)
      });
    } catch (error) {
      reject(error)
    }
  }

  return {
    promise: new Promise(checkCondition),
    cancel,
  }
}
