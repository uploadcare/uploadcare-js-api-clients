import {createError} from './createError'
import {UploadcareError} from './types'

const CancelError = (message = 'Request canceled'): UploadcareError =>
  createError('CancelError', message)

export default CancelError
