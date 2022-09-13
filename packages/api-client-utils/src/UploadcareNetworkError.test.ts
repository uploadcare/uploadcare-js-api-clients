import { UploadcareNetworkError } from './UploadcareNetworkError'

describe('UploadcareNetworkError', () => {
  it('should work', () => {
    const progressEvent = new Event('ProgressEvent') as ProgressEvent
    const error = new UploadcareNetworkError(progressEvent)
    expect(error.name).toBe('UploadcareNetworkError')
    expect(error.message).toBe('Network error')
    expect(error instanceof UploadcareNetworkError).toBeTruthy()
    expect(error.originalProgressEvent).toBe(progressEvent)
  })
})
