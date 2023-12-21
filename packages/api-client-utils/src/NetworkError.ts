export class NetworkError extends Error {
  originalProgressEvent: ProgressEvent

  constructor(progressEvent: ProgressEvent) {
    super()

    this.name = 'NetworkError'
    this.message = 'Network error'
    Object.setPrototypeOf(this, NetworkError.prototype)

    this.originalProgressEvent = progressEvent
  }
}
