export class UploadcareNetworkError extends Error {
  originalProgressEvent: ProgressEvent

  constructor(progressEvent: ProgressEvent) {
    super()

    this.name = 'UploadcareNetworkError'
    this.message = 'Network error'
    Object.setPrototypeOf(this, UploadcareNetworkError.prototype)

    this.originalProgressEvent = progressEvent
  }
}
