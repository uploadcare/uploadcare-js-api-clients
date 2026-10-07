import { beforeEach, expect, it } from 'vitest'
import { resetSession } from '../src/index.js'
import { call } from './emulator.js'

/**
 * Covers `protect` (auth.ts) on the routes whose own test file doesn't already
 * exercise the unauthenticated case (`base.test.ts`, `group.test.ts` and
 * `multipart.test.ts` each cover their own route already — see those files).
 * `/info/`, `/from_url/`, `/group/info/` and `/multipart/complete/` are covered
 * here instead of duplicating a test per file. Bearer tokens and signed uploads
 * are `jwt.test.ts`'s.
 */

beforeEach(() => resetSession())

it('refuses /info/ with no pub_key', async () => {
  const response = await call(
    'https://upload.uploadcare.com/info/?file_id=nope'
  )
  expect(response.status).toBe(403)
})

it('refuses /from_url/ with no pub_key', async () => {
  const response = await call(
    'https://upload.uploadcare.com/from_url/?source_url=https://ucarecdn.com/x.jpg',
    {
      method: 'POST'
    }
  )
  expect(response.status).toBe(403)
})

it('does not require a pub_key on /from_url/status/', async () => {
  const response = await call(
    'https://upload.uploadcare.com/from_url/status/?token=nope'
  )
  // Answers 'unknown' rather than 403: the route isn't protected.
  expect(response.status).toBe(200)
})

it('refuses /group/info/ with no pub_key', async () => {
  const response = await call(
    'https://upload.uploadcare.com/group/info/?group_id=nope'
  )
  expect(response.status).toBe(403)
})

it('refuses /multipart/complete/ with no UPLOADCARE_PUB_KEY', async () => {
  const body = new FormData()
  body.set('uuid', 'nope')
  const response = await call(
    'https://upload.uploadcare.com/multipart/complete/',
    {
      method: 'POST',
      body
    }
  )
  expect(response.status).toBe(403)
})

it('does not require a pub_key on a part PUT', async () => {
  const response = await call(
    'https://upload.uploadcare.com/multipart/upload/some-uuid/original?partNumber=1&uploadId=x',
    { method: 'PUT', body: new Uint8Array([1, 2, 3]) }
  )
  // The upload session doesn't exist, but the route still ran unauthenticated
  // — no 403.
  expect(response.status).toBe(200)
})
