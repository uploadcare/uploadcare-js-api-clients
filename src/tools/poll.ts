const MAX_TIMEOUT = 300

/**
 * Polling function on promises.
 * @param {Function} fn
 * @param {number} timeout
 * @param {number} interval
 */
export default function poll<T>(fn, timeout, interval): Promise<T> {
  let endTime = Number(new Date()) + (timeout || 2000)
  interval = interval || 100

  const checkCondition = (resolve, reject) => {
    // If the condition is met, we're done!
    const result = fn()

    if (result) {
      resolve(result)
    }
    // If the condition isn't met but the timeout hasn't elapsed, go again
    else if (Number(new Date()) < endTime) {
      setTimeout(checkCondition, interval, resolve, reject);
    }
    // Didn't match and too much time, reject!
    else {
      reject(new Error(`Timed out for ${fn}`))
    }
  };

  return new Promise(checkCondition);
}
