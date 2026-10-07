import { beforeEach, expect, it } from 'vitest'
import {
  mintAuthToken,
  resetSession,
  type EmulatorSession
} from '../src/index.js'
import { call, token, uploadFile } from './emulator.js'
import { assertMatchesSpec, jsonError } from './spec.js'

/**
 * `session.use(name, args)`: the named scenarios. Each preset's own route
 * behaviour is asserted here; the chain they ride on is scenarios.test.ts's.
 */

let session: EmulatorSession
beforeEach(() => {
  session = resetSession()
})

const uploadJson = (options?: Parameters<typeof uploadFile>[0]) =>
  uploadFile({ query: '?jsonerrors=1', ...options })

it('answers the session, for chaining', () => {
  expect(session.use('throttle', { match: 'POST /base/' })).toBe(session)
})

it('refuses a preset it does not have', () => {
  expect(() => session.use('nope' as never, undefined as never)).toThrow(
    TypeError
  )
})

it('refuses args of the wrong shape', () => {
  expect(() => session.use('throttle', {} as never)).toThrow(TypeError)
  expect(() =>
    session.use('throttle', { match: 'POST /base/', times: 0 })
  ).toThrow(TypeError)
})

it('is cleared by resetSession()', async () => {
  session.use('throttle', { match: 'POST /base/' })
  resetSession()
  expect(await jsonError(await uploadJson())).toBeUndefined()
})

it('throttle: answers 429 with retry-after once, then lets the request through', async () => {
  session.use('throttle', { match: 'POST /base/' })

  const first = await uploadJson()
  expect(first.headers.get('retry-after')).toBe('1')
  expect(await jsonError(first)).toMatchObject({
    status_code: 429,
    content: 'Request was throttled.',
    error_code: 'RequestThrottledError'
  })
  await assertMatchesSpec(first, { method: 'post', path: '/base/' })

  expect(await uploadJson().then((r) => r.json())).toHaveProperty('file')
})

it('throttle: takes `times` and `retryAfter`', async () => {
  session.use('throttle', { match: 'POST /base/', times: 2, retryAfter: 3 })
  for (const _ of [1, 2]) {
    const response = await uploadJson()
    expect(response.headers.get('retry-after')).toBe('3')
    expect((await jsonError(response)).status_code).toBe(429)
  }
  expect(await uploadJson().then((r) => r.json())).toHaveProperty('file')
})

it('throttle: answers before the gate, whatever the credential', async () => {
  session.use('throttle', { match: 'POST /base/' })
  const response = await call(
    'https://upload.uploadcare.com/base/?jsonerrors=1',
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token()}` },
      body: new FormData()
    }
  )
  expect((await jsonError(response)).status_code).toBe(429)
})

it('throttle: leaves requests outside its match alone', async () => {
  session.use('throttle', { match: 'POST /from_url/' })
  expect(await uploadJson().then((r) => r.json())).toHaveProperty('file')
})

it('signedUploads: refuses an upload without a token, under every key', async () => {
  session.use('signedUploads')
  const response = await uploadJson()
  expect(await jsonError(response)).toMatchObject({
    status_code: 400,
    error_code: 'SignatureRequiredError'
  })
  await assertMatchesSpec(response, { method: 'post', path: '/base/' })
  expect(
    (await jsonError(await uploadJson({ pubKey: 'secret_public_key' })))
      .error_code
  ).toBe('SignatureRequiredError')
})

it('signedUploads: still checks the key first', async () => {
  session.use('signedUploads')
  expect(
    await jsonError(await uploadJson({ pubKey: 'invalid' }))
  ).toMatchObject({
    status_code: 403,
    error_code: 'ProjectPublicKeyInvalidError'
  })
})

it('signedUploads: accepts a token minted with mintAuthToken', async () => {
  session.use('signedUploads')
  const response = await call(
    'https://upload.uploadcare.com/base/?jsonerrors=1',
    {
      method: 'POST',
      headers: { authorization: `Bearer ${await mintAuthToken()}` },
      body: (() => {
        const body = new FormData()
        body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
        body.set('file', new File(['x'], 'a.txt'))
        return body
      })()
    }
  )
  expect(await response.json()).toHaveProperty('file')
})

it('signedUploads: with a publicKey, turns it on for that project alone, which it makes known', async () => {
  expect(
    (await jsonError(await uploadJson({ pubKey: 'pub_signed' }))).error_code
  ).toBe('ProjectPublicKeyInvalidError')

  session.use('signedUploads', { publicKey: 'pub_signed' })
  expect(
    (await jsonError(await uploadJson({ pubKey: 'pub_signed' }))).error_code
  ).toBe('SignatureRequiredError')
  expect(await uploadJson().then((r) => r.json())).toHaveProperty('file')
})

it('signedUploads: refuses a publicKey that is not a string', () => {
  expect(() => session.use('signedUploads', { publicKey: 1 as never })).toThrow(
    TypeError
  )
})
