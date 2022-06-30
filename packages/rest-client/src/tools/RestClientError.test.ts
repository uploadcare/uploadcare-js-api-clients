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

  it('should have status and statusText from response', () => {
    const response = new Response(null, { status: 200, statusText: 'OK' })
    const error = new RestClientError('test error', { response })

    expect(error.status).toBe(200)
    expect(error.statusText).toBe('OK')
  })

  it('should add status and statusText to the message', () => {
    const response = new Response(null, { status: 200, statusText: 'OK' })
    const error = new RestClientError('test error', { response })

    expect(error.message).toBe('[200 OK] test error')
  })

  it('should omit statusText when message equals statusText', () => {
    const response = new Response(null, { status: 200, statusText: 'OK' })
    const error = new RestClientError('OK', { response })

    expect(error.message).toBe('[200] OK')
  })
})
