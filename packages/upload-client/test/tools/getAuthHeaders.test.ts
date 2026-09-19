import { getAuthHeaders } from '../../src/tools/getAuthHeaders'
import { jest, expect } from '@jest/globals'

describe('getAuthHeaders', () => {
  it('should return no headers when token is not provided', async () => {
    expect(await getAuthHeaders(undefined)).toEqual({})
  })

  it('should build a Bearer header from a plain token', async () => {
    expect(await getAuthHeaders('jwt-token')).toEqual({
      Authorization: 'Bearer jwt-token'
    })
  })

  it('should call a sync resolver', async () => {
    const resolver = jest.fn(() => 'jwt-token')

    expect(await getAuthHeaders(resolver)).toEqual({
      Authorization: 'Bearer jwt-token'
    })
    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('should call an async resolver', async () => {
    const resolver = jest.fn(async () => 'jwt-token')

    expect(await getAuthHeaders(resolver)).toEqual({
      Authorization: 'Bearer jwt-token'
    })
    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it('should return no headers when the resolver returns an empty string', async () => {
    expect(await getAuthHeaders(() => '')).toEqual({})
  })
})
