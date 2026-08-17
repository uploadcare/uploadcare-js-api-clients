/**
 * SetTimeout as Promise.
 *
 * @param {number} ms Timeout in milliseconds.
 * @param {AbortSignal} [signal] Resolves the promise early when aborted, so a
 *   caller waiting on it can react to the abort right away.
 */
export const delay = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve()
      return
    }
    const done = (): void => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', done)
      resolve()
    }
    const timer = setTimeout(done, ms)
    signal?.addEventListener('abort', done, { once: true })
  })
