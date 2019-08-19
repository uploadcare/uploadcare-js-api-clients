/**
 * setTimeout as Promise.
 *
 * @param {number} ms Timeout in milliseconds.
 */
export const delay = (ms: number): Promise<void> => new Promise((resolve): number => setTimeout(resolve, ms))
