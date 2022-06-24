import { RestClientError } from './RestClientError'
import { Request, Response } from '../lib/fetch/fetch.node'

describe('RestClientError', () => {
  it('should work', () => {
    const error = new RestClientError('test error')

    expect(error instanceof RestClientError).toBeTruthy()
  })

  it('should have message', () => {
    const error = new RestClientError('test error')

    expect(error.message).toBe('test error')
  })

  it('should have request and/or response', () => {
    const request = new Request('https://ucarecdn.com')
    const response = new Response()

    const error = new RestClientError('test error', { request, response })

    expect(error.request).toBe(request)
    expect(error.response).toBe(response)
  })

  it('should have stack', () => {
    const error = new RestClientError('test error')

    expect(error.stack).toBeDefined()
  })
})
