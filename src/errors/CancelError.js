/* @flow */

export default class CancelError extends Error {
  constructor(...args) {
    super(...args)

    this.name = 'CancelError'
    this.message = 'Request canceled'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CancelError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
