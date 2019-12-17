import { UploadClientError, cancelError } from '../src/errors/errors'

describe('UploadClientError', () => {
  it('should work', () => {
    const error = new UploadClientError('test error')

    expect(error instanceof UploadClientError).toBeTrue()
  })

  it('should have message', () => {
    const error = new UploadClientError('test error')

    expect(error.message).toBe('test error')
  })

  it('should have stack', () => {
    const error = new UploadClientError('test error')

    expect(error.stack).toBeDefined()
  })
})

describe('CancelError', () => {
  it('should work', () => {
    const error = cancelError() // dumb api :sad:

    expect(error instanceof UploadClientError).toBeTrue()
    expect(error.isCancel).toBeTrue()
  })

  it('should have default message', () => {
    const error = cancelError()

    expect(error.message).toBe('Request canceled')
  })
})
