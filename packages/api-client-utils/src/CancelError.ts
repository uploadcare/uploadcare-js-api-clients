export class CancelError extends Error {
  isCancel = true
  constructor(message = 'Request canceled') {
    super(message)
    Object.setPrototypeOf(this, CancelError.prototype)
  }
}
