export default class CancelError extends Error {
  constructor() {
    super()

    this.name = 'CancelError'
    this.message = 'Request canceled'

    Object.setPrototypeOf(this, CancelError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CancelError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
