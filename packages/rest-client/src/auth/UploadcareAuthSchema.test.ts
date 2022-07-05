import { describe, expect, it, jest } from '@jest/globals'
import { delay } from '@uploadcare/api-client-utils'
import { Headers, Request } from '../lib/fetch/fetch.node'
import { defaultSettings } from '../settings'
import { UploadcareAuthSchema } from './UploadcareAuthSchema'

const ALLOWED_DATE_DIFFERENCE = 5000

describe('UploadcareAuthScheme', () => {
  it('should return proper headers with public key and resolved signature', async () => {
    const signatureResolver = async () => {
      await delay(100)
      return 'signature'
    }
    const authScheme = new UploadcareAuthSchema({
      publicKey: 'public-key',
      signatureResolver
    })
    expect(authScheme.publicKey).toBe('public-key')

    const headers = new Headers({
      'Content-Type': 'application/json'
    })
    const request = new Request(defaultSettings.apiBaseURL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ foo: 'bar' })
    })
    const authHeaders = await authScheme.getHeaders(request)
    expect(authHeaders.get('Authorization')).toEqual(
      'Uploadcare public-key:signature'
    )
    expect(authHeaders.get('Accept')).toEqual(
      'application/vnd.uploadcare-v0.7+json'
    )

    const date = new Date(authHeaders.get('X-Uploadcare-Date') as string)
    expect(Date.now() - date.getTime()).toBeLessThanOrEqual(
      ALLOWED_DATE_DIFFERENCE
    )
  })

  it('should pass correct params to the signature resolver', async () => {
    const signatureResolver = jest.fn(async () => 'signature')
    const authScheme = new UploadcareAuthSchema({
      publicKey: 'public-key',
      signatureResolver
    })

    const headers = new Headers({
      'Content-Type': 'application/json'
    })
    const request = new Request(
      `${defaultSettings.apiBaseURL}files/?limit=1&stored=true`,
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ foo: 'bar' })
      }
    )

    await authScheme.getHeaders(request)

    const signString = (signatureResolver.mock.calls[0] as never)[0] as string
    const paramsOrder = ['method', 'contentHash', 'contentType', 'date', 'uri']
    const signParams = signString
      .split('\n')
      .reduce(
        (acc, value, idx) => ({ ...acc, [paramsOrder[idx]]: value }),
        {}
      ) as {
      method: string
      contentHash: string
      contentType: string
      date: string
      uri: string
    }

    const currentDate = new Date()
    const authDate = new Date(signParams.date)

    expect(currentDate.getTime() - authDate.getTime()).toBeLessThan(
      ALLOWED_DATE_DIFFERENCE
    )
    expect(signParams).toEqual({
      uri: '/files/?limit=1&stored=true',
      method: 'POST',
      contentType: 'application/json',

      contentHash: '9bb58f26192e4ba00f01e2e7b136bbd8', // {"foo":"bar"}
      date: authDate.toUTCString()
    })
  })

  it('should accept secretKey instead of custom signature resolver', async () => {
    const authScheme = new UploadcareAuthSchema({
      publicKey: 'public-key',
      secretKey: 'secret-key'
    })

    const body = JSON.stringify({ foo: 'bar' })
    const request = new Request(defaultSettings.apiBaseURL, {
      method: 'POST',
      body
    })

    const authHeaders = await authScheme.getHeaders(request)
    expect(
      authHeaders.get('Authorization')?.startsWith('Uploadcare public-key:')
    ).toBeTruthy()
    expect(authHeaders.get('Accept')).toEqual(
      'application/vnd.uploadcare-v0.7+json'
    )

    const date = new Date(authHeaders.get('X-Uploadcare-Date') as string)
    expect(Date.now() - date.getTime()).toBeLessThanOrEqual(
      ALLOWED_DATE_DIFFERENCE
    )
  })

  it('should accept custom md5 function', async () => {
    const signatureResolver = jest.fn(async () => 'signature')
    const customMd5 = jest.fn(() => 'hash')

    const authScheme = new UploadcareAuthSchema({
      publicKey: 'public-key',
      signatureResolver,
      md5Loader: async () => customMd5
    })

    const body = JSON.stringify({ foo: 'bar' })
    const request = new Request(defaultSettings.apiBaseURL, {
      method: 'POST',
      body
    })

    await authScheme.getHeaders(request)

    const signString = (signatureResolver.mock.calls[0] as never)[0] as string
    const contentHash = signString.split('\n')[1]

    expect(customMd5).toHaveBeenCalledWith(body)
    expect(contentHash).toBe('hash')
  })
})
