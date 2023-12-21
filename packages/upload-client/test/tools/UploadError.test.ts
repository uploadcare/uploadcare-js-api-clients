import { UploadcareError } from '@uploadcare/api-client-utils'
import { UploadError } from '../../src/tools/UploadError'

describe('UploadError', () => {
  it('should work', () => {
    const error = new UploadError('test error')

    expect(error instanceof UploadError).toBeTruthy()
  })

  it('should have message', () => {
    const error = new UploadError('test error')

    expect(error.message).toBe('test error')
  })

  it('should have code', () => {
    const error = new UploadError('test error', 'error code')

    expect(error.message).toBe('test error')
    expect(error.code).toBe('error code')
  })

  it('should have stack', () => {
    const error = new UploadError('test error')

    expect(error.stack).toBeDefined()
  })

  it('should be instanceof UploadcareError', () => {
    const error = new UploadError('test error')
    expect(error).toBeInstanceOf(UploadcareError)
  })
})
