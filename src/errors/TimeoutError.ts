export default class TimeoutError extends Error {
  constructor(fn: Function) {
    super()

    this.name = 'TimeoutError'
    this.message = `Timed out for "${fn}"`

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
