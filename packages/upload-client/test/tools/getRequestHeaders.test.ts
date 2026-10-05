import { expect, jest } from '@jest/globals'
import { getRequestHeaders } from '../../src/tools/getRequestHeaders'

describe('getRequestHeaders', () => {
  it('should build the user-agent header from the public key', async () => {
    const headers = await getRequestHeaders({ publicKey: 'test-key' })

    expect(headers['X-UC-User-Agent']).toContain('UploadcareUploadClient')
    expect(headers['X-UC-User-Agent']).toContain('test-key')
    expect(headers.Authorization).toBeUndefined()
  })

  it('should skip the user-agent header without a public key', async () => {
    const headers = await getRequestHeaders({ authToken: 'jwt' })

    expect(headers).toEqual({ Authorization: 'Bearer jwt' })
  })

  it('should call a sync resolver', async () => {
    const resolver = jest.fn(() => 'jwt-token')
    const headers = await getRequestHeaders({ authToken: resolver })

    expect(headers).toEqual({ Authorization: 'Bearer jwt-token' })
    expect(resolver).toHaveBeenCalledTimes(1)
  })

  it.each([undefined, null, ''])(
    'should send no Authorization header when authToken is %p',
    async (value) => {
      const headers = await getRequestHeaders({
        authToken: value as unknown as string
      })

      expect(headers.Authorization).toBeUndefined()
    }
  )

  it('should reject a resolver that returns nothing rather than send no header', async () => {
    await expect(getRequestHeaders({ authToken: () => '' })).rejects.toThrow(
      'token function returned no token'
    )
  })

  it('should resolve an auth token resolver per call', async () => {
    let calls = 0
    const headers = await getRequestHeaders({
      publicKey: 'test-key',
      authToken: async () => `jwt-${++calls}`
    })

    expect(headers.Authorization).toBe('Bearer jwt-1')
    await getRequestHeaders({
      publicKey: 'test-key',
      authToken: async () => `jwt-${++calls}`
    })
    expect(calls).toBe(2)
  })
})
