import { describe, expect, it } from '@jest/globals'
import { Request, Response } from '../lib/fetch/fetch.node'
import { RestClientError } from '../tools/RestClientError'
import {
  isRestClientValidationError,
  RestClientValidationError
} from '../tools/RestClientValidationError'
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

  it('should throw a plain RestClientError for a detail body', async () => {
    expect.assertions(2)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf({ detail: 'file not found' }, 404),
        okCodes: [200]
      })
    } catch (error) {
      expect(error).toBeInstanceOf(RestClientError)
      expect(isRestClientValidationError(error)).toBe(false)
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
      const restClientError = error as RestClientValidationError
      expect(restClientError.message).toBe(
        '[400 Bad Request] size: value must be an object; sort: too many keys, unknown key'
      )
      expect(restClientError.errors).toEqual({
        size: ['value must be an object'],
        sort: ['too many keys', 'unknown key']
      })
    }
  })

  // Both bodies below were captured from POST /files/search/, which nests one
  // level deeper than the API docs describe.
  it('should read a complaint nested under the field it belongs to', async () => {
    expect.assertions(2)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf(
          {
            size: {
              non_field_errors: [
                'Invalid data. Expected a dictionary, but got int.'
              ]
            }
          },
          400
        ),
        okCodes: [200]
      })
    } catch (error) {
      const restClientError = error as RestClientValidationError
      expect(restClientError.message).toBe(
        '[400 Bad Request] size: Invalid data. Expected a dictionary, but got int.'
      )
      expect(restClientError.errors).toEqual({
        size: ['Invalid data. Expected a dictionary, but got int.']
      })
    }
  })

  it('should report top-level non_field_errors without a field prefix', async () => {
    expect.assertions(2)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf(
          {
            non_field_errors: [
              'At least one search criterion must be specified.'
            ]
          },
          400
        ),
        okCodes: [200]
      })
    } catch (error) {
      const restClientError = error as RestClientValidationError
      expect(restClientError.message).toBe(
        '[400 Bad Request] At least one search criterion must be specified.'
      )
      expect(restClientError.errors).toEqual({
        nonFieldErrors: ['At least one search criterion must be specified.']
      })
    }
  })

  // A string or an array of them is a complaint about a field; anything else is
  // some other kind of body, and the message stays what it was before this
  // fallback existed: RestClientError does not repeat the status text.
  it.each([
    ['a value that is neither string nor array', { whatever: 42 }],
    ['an array at the root', ['nope']],
    ['a body with no keys', {}],
    ['mixed leaves, one of them unreadable', { size: ['too small'], n: 42 }]
  ])('should fall back to the status given %s', async (_name, body) => {
    expect.assertions(2)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf(body, 400),
        okCodes: [200]
      })
    } catch (error) {
      expect((error as RestClientError).message).toBe('[400] Bad Request')
      expect(isRestClientValidationError(error)).toBe(false)
    }
  })

  it('should throw a validation error that is still a RestClientError', async () => {
    expect.assertions(4)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf(
          { query: ['Must be at least 4 characters.'] },
          400
        ),
        okCodes: [200]
      })
    } catch (error) {
      expect(error).toBeInstanceOf(RestClientValidationError)
      expect(error).toBeInstanceOf(RestClientError)
      expect(isRestClientValidationError(error)).toBe(true)
      expect((error as RestClientValidationError).name).toBe(
        'RestClientValidationError'
      )
    }
  })

  it('should camelize field names but leave metadata keys alone', async () => {
    expect.assertions(1)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf(
          {
            datetime_uploaded: { non_field_errors: ['Invalid date.'] },
            exact: { 'metadata[my_key]': ['Not a list.'] }
          },
          400
        ),
        okCodes: [200]
      })
    } catch (error) {
      expect((error as RestClientValidationError).errors).toEqual({
        datetimeUploaded: ['Invalid date.'],
        'exact.metadata[my_key]': ['Not a list.']
      })
    }
  })

  it('should read a complaint sent as a bare string, not an array', async () => {
    expect.assertions(2)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf({ is_image: 'Must be a boolean value.' }, 400),
        okCodes: [200]
      })
    } catch (error) {
      const restClientError = error as RestClientValidationError
      expect(restClientError.message).toBe(
        '[400 Bad Request] isImage: Must be a boolean value.'
      )
      expect(restClientError.errors).toEqual({
        isImage: ['Must be a boolean value.']
      })
    }
  })

  it('should read a complaint keyed by list index', async () => {
    expect.assertions(1)
    try {
      await handleApiRequest({
        apiRequest: apiRequestOf(
          { sort: { 0: ['"nope" is not a valid choice.'] } },
          400
        ),
        okCodes: [200]
      })
    } catch (error) {
      expect((error as RestClientValidationError).errors).toEqual({
        'sort.0': ['"nope" is not a valid choice.']
      })
    }
  })
})
