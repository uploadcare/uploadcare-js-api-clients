export default class EntityIsNotReadyError extends Error {
  constructor() {
    super()

    this.name = 'EntityIsNotReadyError'
    this.message = 'Entity is not ready yet'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EntityIsNotReadyError)
    }
    else {
      this.stack = (new Error()).stack
    }
  }
}
