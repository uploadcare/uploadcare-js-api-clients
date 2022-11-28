import { CancelError } from './CancelError'

describe('CancelError', () => {
  it('should have "isCancel" property with "true" value', async () => {
    const cancelError = new CancelError('Cancelled!')
    expect(cancelError.isCancel).toBe(true)
  })

  it('should have default messgage', async () => {
    const cancelError = new CancelError()
    expect(cancelError.message).toBe('Request canceled')
    expect(cancelError.isCancel).toBe(true)
  })

  it('should be able to pass message', async () => {
    const cancelError = new CancelError('Message')
    expect(cancelError.message).toBe('Message')
    expect(cancelError.isCancel).toBe(true)
  })
})
