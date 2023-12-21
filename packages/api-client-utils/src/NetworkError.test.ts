import { NetworkError } from './NetworkError'
import { UploadcareError } from './UploadcareError'

describe('NetworkError', () => {
  it('should work', () => {
    const progressEvent = new Event('ProgressEvent') as ProgressEvent
    const error = new NetworkError(progressEvent)
    expect(error.name).toBe('NetworkError')
    expect(error.message).toBe('Network error')
    expect(error instanceof NetworkError).toBeTruthy()
    expect(error.originalProgressEvent).toBe(progressEvent)
  })

  it('should be instanceof UploadcareError', () => {
    const progressEvent = new Event('ProgressEvent') as ProgressEvent
    const error = new NetworkError(progressEvent)
    expect(error).toBeInstanceOf(UploadcareError)
  })
})
