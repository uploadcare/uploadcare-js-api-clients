import { CancelError } from './CancelError'
import { delay } from './delay'

type PollCheckFunction<T> = (
  signal?: AbortSignal
) => Promise<false | T> | false | T

const DEFAULT_INTERVAL = 500

/**
 * Call `check` until it returns something truthy, waiting `interval`
 * milliseconds between attempts, and resolve with that value.
 *
 * Rejects with a `CancelError` when `signal` aborts or `timeout` elapses,
 * whichever happens first. Either one stops the loop for good: no further
 * `check` call is made, and a call already in flight is abandoned.
 *
 * @param check Runs one attempt; anything falsy means "not done yet". Receives
 *   `signal` so the attempt itself can be aborted.
 * @param interval Milliseconds between attempts. Defaults to 500.
 * @param timeout Milliseconds to keep trying for. Unbounded when omitted.
 * @param signal Aborts the polling.
 */
const poll = async <T>({
  check,
  interval = DEFAULT_INTERVAL,
  timeout,
  signal
}: {
  check: PollCheckFunction<T>
  timeout?: number
  interval?: number
  signal?: AbortSignal
}): Promise<T> => {
  const startedAt = Date.now()
  const timeLeft = (): number =>
    timeout === undefined ? Infinity : timeout - (Date.now() - startedAt)

  for (;;) {
    if (signal?.aborted) {
      throw new CancelError('Poll cancelled')
    }
    if (timeLeft() <= 0) {
      throw new CancelError('Timed out')
    }

    let result: false | T
    try {
      result = await check(signal)
    } catch (error) {
      // A rejection caused by our own abort is a cancellation, not a failure.
      throw signal?.aborted ? new CancelError('Poll cancelled') : error
    }
    if (result) {
      return result
    }

    // Never sleep past the deadline, so the timeout is reported on time.
    await delay(Math.min(interval, timeLeft()), signal)
  }
}

export { poll, PollCheckFunction }
