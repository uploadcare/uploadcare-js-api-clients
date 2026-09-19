import { beforeEach, expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'

/**
 * Covers the router's `protected` flag on the routes whose own test file
 * doesn't already exercise the unauthenticated case (`base.test.ts`,
 * `group.test.ts` and `multipart.test.ts` each cover their own route already —
 * see those files). `/info/`, `/from_url/`, `/group/info/` and
 * `/multipart/complete/` are covered here instead of duplicating a test per
 * file.
 *
 * There is no JWT/bearer-token auth on this branch — see the task brief's own
 * correction. This is public-key auth only.
 */

beforeEach(() => resetSession())

it('refuses /info/ with no pub_key', async () => {
  const response = await handle(
    new Request('https://upload.uploadcare.com/info/?file_id=nope')
  )
  expect(response!.status).toBe(403)
})

it('refuses /from_url/ with no pub_key', async () => {
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/from_url/?source_url=https://ucarecdn.com/x.jpg',
      {
        method: 'POST'
      }
    )
  )
  expect(response!.status).toBe(403)
})

it('does not require a pub_key on /from_url/status/', async () => {
  const response = await handle(
    new Request('https://upload.uploadcare.com/from_url/status/?token=nope')
  )
  // Answers 'unknown' rather than 403 — this route was never protected in the
  // old mock server either.
  expect(response!.status).toBe(200)
})

it('refuses /group/info/ with no pub_key', async () => {
  const response = await handle(
    new Request('https://upload.uploadcare.com/group/info/?group_id=nope')
  )
  expect(response!.status).toBe(403)
})

it('refuses /multipart/complete/ with no UPLOADCARE_PUB_KEY', async () => {
  const body = new FormData()
  body.set('uuid', 'nope')
  const response = await handle(
    new Request('https://upload.uploadcare.com/multipart/complete/', {
      method: 'POST',
      body
    })
  )
  expect(response!.status).toBe(403)
})

it('does not require a pub_key on a part PUT', async () => {
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/multipart/upload/some-uuid/original?partNumber=1&uploadId=x',
      { method: 'PUT', body: new Uint8Array([1, 2, 3]) }
    )
  )
  // The upload session doesn't exist, but the route still ran unauthenticated
  // — no 403.
  expect(response!.status).toBe(200)
})

it('/throttle/ answers 429 then 200, per session', async () => {
  const url = 'https://upload.uploadcare.com/throttle/?pub_key=demopublickey'
  const first = await handle(new Request(url, { method: 'POST' }))
  expect(first!.status).toBe(429)
  expect(await first!.clone().text()).toBe('Request was throttled.')

  const second = await handle(new Request(url, { method: 'POST' }))
  expect(second!.status).toBe(200)

  const third = await handle(new Request(url, { method: 'POST' }))
  expect(third!.status).toBe(429)
})

it('refuses /throttle/ with no pub_key', async () => {
  const response = await handle(
    new Request('https://upload.uploadcare.com/throttle/', { method: 'POST' })
  )
  expect(response!.status).toBe(403)
})
