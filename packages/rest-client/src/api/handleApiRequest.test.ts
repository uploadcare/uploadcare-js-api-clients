import { describe, expect, it } from '@jest/globals'
import { Request, Response } from '../lib/fetch/fetch.node'
import { RestClientError } from '../tools/RestClientError'
import { handleApiRequest } from './handleApiRequest'

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })

const apiRequestOf = (body: unknown, status: number) => ({
  request: new Request('https://api.uploadcare.com/files/search/'),
  response: jsonResponse(body, status) as unknown as Response
})

describe('handleApiRequest', () => {
  it('should camelize a successful response', async () => {
    const result = await handleApiRequest({
      apiRequest: apiRequestOf({ per_page: 20, results: [] }, 200),
      okCodes: [200]
    })

    expect(result).toEqual({ perPage: 20, results: [] })
  })

  it('should use detail as the message, unchanged', async () => {
    const promise = handleApiRequest({
      apiRequest: apiRequestOf({ detail: 'file not found' }, 404),
      okCodes: [200]
    })

    await expect(promise).rejects.toThrow('file not found')
    await expect(promise).rejects.toMatchObject({ status: 404 })
  })

  it('should leave errors undefined for a detail body', async () => {
    expect.assertions(1)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf({ detail: 'file not found' }, 404),
        okCodes: [200]
      })
    } catch (error) {
      expect((error as RestClientError).errors).toBeUndefined()
    }
  })

  it('should name the offending fields when the body carries per-field errors', async () => {
    expect.assertions(2)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf(
          {
            size: ['value must be an object'],
            sort: ['too many keys', 'unknown key']
          },
          400
        ),
        okCodes: [200]
      })
    } catch (error) {
      const restClientError = error as RestClientError
      expect(restClientError.message).toBe(
        '[400 Bad Request] size: value must be an object; sort: too many keys, unknown key'
      )
      expect(restClientError.errors).toEqual({
        size: ['value must be an object'],
        sort: ['too many keys', 'unknown key']
      })
    }
  })

  it('should fall back to the status when an error body is neither shape', async () => {
    expect.assertions(2)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf({ whatever: 'not an array' }, 400),
        okCodes: [200]
      })
    } catch (error) {
      const restClientError = error as RestClientError
      // Unchanged from before this fallback existed: with no message to add,
      // RestClientError does not repeat the status text.
      expect(restClientError.message).toBe('[400] Bad Request')
      expect(restClientError.errors).toBeUndefined()
    }
  })
})
