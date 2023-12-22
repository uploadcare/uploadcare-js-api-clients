import { CancelError } from './CancelError'
import { UploadcareError } from './UploadcareError'

describe('CancelError', () => {
  it('should have "isCancel" property with "true" value', () => {
    const cancelError = new CancelError('Cancelled!')
    expect(cancelError.isCancel).toBe(true)
  })

  it('should have default messgage', () => {
    const cancelError = new CancelError()
    expect(cancelError.message).toBe('Request canceled')
    expect(cancelError.isCancel).toBe(true)
  })

  it('should be able to pass message', () => {
    const cancelError = new CancelError('Message')
    expect(cancelError.message).toBe('Message')
    expect(cancelError.isCancel).toBe(true)
  })

  it('should be instanceof UploadcareError', () => {
    expect(new CancelError()).toBeInstanceOf(UploadcareError)
  })
})
