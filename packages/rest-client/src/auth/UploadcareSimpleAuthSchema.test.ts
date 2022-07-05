import { expect, it, describe } from '@jest/globals'
import { UploadcareSimpleAuthSchema } from './UploadcareSimpleAuthSchema'

describe('UploadcareSimpleAuthScheme', () => {
  it('should return Authorization header with public and secret keys', async () => {
    const authScheme = new UploadcareSimpleAuthSchema({
      publicKey: 'public-key',
      secretKey: 'secret-key'
    })
    expect(authScheme.publicKey).toBe('public-key')

    const authHeaders = await authScheme.getHeaders()

    expect(authHeaders.get('Authorization')).toEqual(
      'Uploadcare.Simple public-key:secret-key'
    )
    expect(authHeaders.get('Accept')).toEqual(
      'application/vnd.uploadcare-v0.7+json'
    )
  })
})
