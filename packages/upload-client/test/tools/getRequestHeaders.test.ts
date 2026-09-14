import { expect } from '@jest/globals'
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
