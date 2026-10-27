const warnings = new Set<string>()

/**
 * `console.warn` the first time it sees a message, then stay quiet.
 *
 * For conditions that recur on a hot path, where warning every time would bury
 * the console. Deduplication is per message and lasts the life of the process,
 * so build the string from the condition rather than from per-call values.
 */
export const warnOnce = (message: string): void => {
  if (warnings.has(message)) {
    return
  }

  warnings.add(message)
  console.warn(message)
}
