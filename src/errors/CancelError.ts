import {createError} from './createError'
import {UploadcareError} from './types'

export const CancelError = (message = 'Request canceled'): UploadcareError =>
  createError('CancelError', message)
