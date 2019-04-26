import {Thenable} from './Thenable'
import TimeoutError from '../errors/TimeoutError'
import {CancelableInterface} from '../api/types'
import CancelError from '../errors/CancelError'

const MAX_TIMEOUT = 3000
const MAX_INTERVAL = 500

export interface PollPromiseInterface<T> extends Promise<T>, CancelableInterface {}

type ExecutorFunction = {
  (resolve: Function, reject: Function): void
}

class PollPromise<T> extends Thenable<T> implements PollPromiseInterface<T> {
  protected promise: Promise<T>
  protected canceled: boolean = false

  constructor(executor: ExecutorFunction) {
    super()
    this.promise = new Promise<T>(executor)
      .then(response => {
        if (!this.canceled) {
          return Promise.resolve(response)
        }

        throw new CancelError()
      }, error => {
        if (!this.canceled) {
          return Promise.reject(error)
        }

        throw new CancelError()
      })
  }

  cancel() {
    this.canceled = true
    throw new CancelError()
  }
}

/**
 * Polling function on promises.
 * @param {Function} checkConditionFunction Function to check condition of polling.
 * @param {number} timeout
 * @param {number} interval
 * @return {PollPromiseInterface}
 */
export default function poll<T>(checkConditionFunction: Function, timeout: number, interval: number = 150): PollPromiseInterface<T> {
  const startTime = Number(new Date())
  const endTime = startTime + Math.min(timeout, MAX_TIMEOUT)

  interval = Math.min(interval, MAX_INTERVAL)

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
        setTimeout(checkCondition, interval, resolve, reject);
      }
      // Didn't match and too much time, reject!
      else {
        reject(new TimeoutError(checkConditionFunction))
      }
    } catch (error) {
      reject(error)
    }
  };

  return new PollPromise(checkCondition)
}
