import { NetworkError } from './NetworkError'

describe('NetworkError', () => {
  it('should work', () => {
    const progressEvent = new Event('ProgressEvent') as ProgressEvent
    const error = new NetworkError(progressEvent)
    expect(error.name).toBe('NetworkError')
    expect(error.message).toBe('Network error')
    expect(error instanceof NetworkError).toBeTruthy()
    expect(error.originalProgressEvent).toBe(progressEvent)
  })
})
