import { RestClientError } from './RestClientError'
import { Request, Response } from '../lib/fetch/fetch.node'

describe('RestClientError', () => {
  it('should work', () => {
    const error = new RestClientError()

    expect(error instanceof RestClientError).toBeTruthy()
    expect(error.name).toBe('RestClientError')
  })

  it('should have message', () => {
    const error = new RestClientError('test error')

    expect(error.message).toBe('test error')
  })

  it('should have default message', () => {
    const error = new RestClientError()

    expect(error.message).toBe('Unknown error')
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

  it('should copy status and statusText from response automatically', () => {
    const response = new Response(null, { status: 200, statusText: 'OK' })
    const error = new RestClientError('test error', { response })

    expect(error.status).toBe(200)
    expect(error.statusText).toBe('OK')
  })

  it('should be serialized to string', () => {
    const response = new Response(null, {
      status: 404,
      statusText: 'Not found'
    })
    const error = new RestClientError('test error', { response })

    expect(error.toString()).toBe('RestClientError[404 Not found]: test error')
  })
})
