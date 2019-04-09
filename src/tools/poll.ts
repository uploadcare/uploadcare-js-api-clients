import {Thenable} from './Thenable'

const MAX_TIMEOUT = 300

interface PollPromiseInterface<T> extends Promise<T> {
  cancel: VoidFunction
}

interface ExecutorFunction {
  (resolve: Function, reject: Function): void
}

class PollPromise<T> extends Thenable<T> implements PollPromiseInterface<T> {
  protected request: Promise<T>
  private readonly timerId: any

  constructor(executor: ExecutorFunction, timerId?: any) {
    super()
    this.request = new Promise(executor)
    this.timerId = timerId
  }

  cancel() {
    clearTimeout(this.timerId)
  }
}

/**
 * Polling function on promises.
 * @param {Function} fn
 * @param {number} timeout
 * @param {number} interval
 */
export default function poll<T>(fn, timeout, interval): Promise<T> {
  let endTime = Number(new Date()) + (timeout || MAX_TIMEOUT)
  let timerId
  interval = interval || 100

  const checkCondition = (resolve, reject) => {
    // If the condition is met, we're done!
    const result = fn()

    if (result) {
      resolve(result)
    }
    // If the condition isn't met but the timeout hasn't elapsed, go again
    else if (Number(new Date()) < endTime) {
      timerId = setTimeout(checkCondition, interval, resolve, reject);
    }
    // Didn't match and too much time, reject!
    else {
      reject(new Error(`Timed out for ${fn}`))
    }
  };

  return new PollPromise(checkCondition, timerId)
}
