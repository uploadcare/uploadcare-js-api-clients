import { beforeEach, expect, it } from 'vitest'
import { resetSession, type EmulatorSession } from '../src/index.js'
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
