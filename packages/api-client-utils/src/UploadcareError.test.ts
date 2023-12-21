import { UploadcareError } from './UploadcareError'

describe('UploadcareError', () => {
  it('should be instanceof Error', async () => {
    const uploadcareError = new UploadcareError('This is error!')
    expect(uploadcareError instanceof Error).toBe(true)
  })
})
