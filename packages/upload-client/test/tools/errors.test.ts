import { UploadClientError } from '../../src/tools/errors'

describe('UploadClientError', () => {
  it('should work', () => {
    const error = new UploadClientError('test error')

    expect(error instanceof UploadClientError).toBeTruthy()
  })

  it('should have message', () => {
    const error = new UploadClientError('test error')

    expect(error.message).toBe('test error')
  })

  it('should have code', () => {
    const error = new UploadClientError('test error', 'error code')

    expect(error.message).toBe('test error')
    expect(error.code).toBe('error code')
  })

  it('should have stack', () => {
    const error = new UploadClientError('test error')

    expect(error.stack).toBeDefined()
  })
})
