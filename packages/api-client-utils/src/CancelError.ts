import { UploadcareError } from './UploadcareError'

export class CancelError extends UploadcareError {
  isCancel = true

  constructor(message = 'Request canceled') {
    super(message)

    this.name = 'CancelError'
    Object.setPrototypeOf(this, CancelError.prototype)
  }
}
