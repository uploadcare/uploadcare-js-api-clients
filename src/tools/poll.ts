import {Thenable} from './Thenable'
import TimeoutError from '../errors/TimeoutError'
import {CancelableInterface} from '../api/types'
import CancelError from '../errors/CancelError'

const MAX_TIMEOUT = 300
const MAX_INTERVAL = 100

export interface PollPromiseInterface<T> extends Promise<T>, CancelableInterface {}

type ExecutorFunction = {
  (resolve: Function, reject: Function): void
}

class PollPromise<T> extends Thenable<T> implements PollPromiseInterface<T> {
  protected promise: Promise<T>
  private readonly timeoutId: any

  constructor(executor: ExecutorFunction, timeoutId?: any) {
    super()
    this.promise = new Promise(executor)
    this.timeoutId = timeoutId
  }

  cancel() {
    clearTimeout(this.timeoutId)
    throw new CancelError()
  }
}

type CheckConditionFunction<T> = {
  (): boolean | T
}

/**
 * Polling function on promises.
 * @param {CheckConditionFunction} checkConditionFunction Function to check condition of polling.
 * @param {number} timeout
 * @param {number} interval
 */
export default function poll<T>(checkConditionFunction, timeout: number, interval: number): PollPromiseInterface<T> {
  let endTime = Number(new Date()) + Math.min(timeout, MAX_TIMEOUT)
  let timeoutId
  interval = Math.min(interval, MAX_INTERVAL)

  const checkCondition: ExecutorFunction = (resolve, reject) => {
    // If the condition is met, we're done!
    const result = checkConditionFunction()

    if (result) {
      resolve(result)
    }
    // If the condition isn't met but the timeout hasn't elapsed, go again
    else if (Number(new Date()) < endTime) {
      timeoutId = setTimeout(checkCondition, interval, resolve, reject);
    }
    // Didn't match and too much time, reject!
    else {
      reject(new TimeoutError(checkConditionFunction))
    }
  };

  return new PollPromise(checkCondition, timeoutId)
}
