import { expect, it, describe } from '@jest/globals'
import { UploadcareSimpleAuthSchema } from './UploadcareSimpleAuthSchema'
import { defaultSettings } from '../settings'
import { Headers, Request } from '../lib/fetch/fetch.node'

describe('UploadcareSimpleAuthScheme', () => {
  it('should return Authorization header with public and secret keys', async () => {
    const authScheme = new UploadcareSimpleAuthSchema({
      publicKey: 'public-key',
      secretKey: 'secret-key'
    })
    expect(authScheme.publicKey).toBe('public-key')

    const headers = new Headers({
      'X-Test-Header': 'header-value'
    })

    const request = new Request(defaultSettings.apiBaseURL, {
      method: 'GET',
      headers: headers
    })

    const authHeaders = await authScheme.getHeaders(request)

    expect(authHeaders.get('Authorization')).toEqual(
      'Uploadcare.Simple public-key:secret-key'
    )
    expect(authHeaders.get('Accept')).toEqual(
      'application/vnd.uploadcare-v0.7+json'
    )
    expect(authHeaders.get('X-Test-Header')).toEqual('header-value')
  })
})
