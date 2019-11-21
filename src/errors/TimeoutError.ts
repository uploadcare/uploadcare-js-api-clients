export default class TimeoutError extends Error {
  constructor(fn: string, timeout: number) {
    super()

    this.name = 'TimeoutError'
    this.message = `Timed out for function "${fn}" after ${timeout} ms`

    Object.setPrototypeOf(this, TimeoutError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
