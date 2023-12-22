import { UploadcareError } from './UploadcareError'

export class NetworkError extends UploadcareError {
  originalProgressEvent: ProgressEvent

  constructor(progressEvent: ProgressEvent) {
    super()

    this.name = 'NetworkError'
    this.message = 'Network error'
    Object.setPrototypeOf(this, NetworkError.prototype)

    this.originalProgressEvent = progressEvent
  }
}
