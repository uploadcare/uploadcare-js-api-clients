import { beforeEach, expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'
import { assertMatchesSpec } from './spec.js'

// `jsonerrors=1`, exactly as `upload-client` always sends it — without it
// `apiError` answers `text/plain`, which the brief's own test snippet for this
// task overlooked (see task-3-report.md).
const post = async (query: string) =>
  (await handle(
    new Request(
      `https://upload.uploadcare.com/from_url/?${query}&jsonerrors=1`,
      {
        method: 'POST'
      }
    )
  ))!

const poll = async (token: string) => {
  const response = (await handle(
    new Request(`https://upload.uploadcare.com/from_url/status/?token=${token}`)
  ))!
  const body = (await response.clone().json()) as Record<string, unknown>
  await assertMatchesSpec({
    method: 'get',
    path: '/from_url/status/',
    status: response.status,
    response,
    body
  })
  return body
}

const SOURCE = 'https://images.unsplash.com/photo-1?dl=holiday.jpg'

beforeEach(() => resetSession())

it('refuses a request with no source_url', async () => {
  const response = await post('pub_key=demopublickey')
  expect(response.status).toBe(400)
  const parsed = await response.clone().json()
  expect(parsed).toMatchObject({
    error: { content: 'source_url is required.' }
  })
  await assertMatchesSpec({
    method: 'post',
    path: '/from_url/',
    status: 400,
    response,
    body: parsed
  })
})

it('refuses a host that does not exist', async () => {
  const response = await post(
    'pub_key=demopublickey&source_url=https%3A%2F%2F1.com%2F1.jpg'
  )
  expect(response.status).toBe(400)
  expect(await response.json()).toMatchObject({
    error: { content: 'Host does not exist.' }
  })
})

it('refuses a private address', async () => {
  const response = await post(
    'pub_key=demopublickey&source_url=http%3A%2F%2F192.168.0.1%2Fa.jpg'
  )
  expect(response.status).toBe(400)
  expect(await response.json()).toMatchObject({
    error: { content: 'Only public IPs are allowed.' }
  })
})

it('allows a source_url on the emulator itself, despite being "localhost"', async () => {
  const response = await post(
    `pub_key=demopublickey&source_url=${encodeURIComponent('http://localhost:3000/49b4c5a1-31b3-4349-ba07-d97a2d883c37/x.png')}`
  )
  expect(response.status).toBe(200)
})

it('reports progress before it succeeds, and names the file from the url', async () => {
  const post200 = await post(
    `pub_key=demopublickey&source_url=${encodeURIComponent(SOURCE)}`
  )
  const parsed = (await post200.clone().json()) as { token: string }
  await assertMatchesSpec({
    method: 'post',
    path: '/from_url/',
    status: 200,
    response: post200,
    body: parsed
  })
  const { token } = parsed

  expect(await poll(token)).toMatchObject({ status: 'progress' })
  let last = await poll(token)
  while (last.status === 'progress') last = await poll(token)

  expect(last).toMatchObject({
    status: 'success',
    original_filename: 'holiday.jpg'
  })
})

it('names the file from the last path segment when there is no dl param', async () => {
  const { token } = (await post(
    `pub_key=demopublickey&source_url=${encodeURIComponent('https://images.unsplash.com/photo-2.jpg')}`
  ).then((r) => r.json())) as { token: string }

  let last = await poll(token)
  while (last.status === 'progress') last = await poll(token)
  expect(last).toMatchObject({ original_filename: 'photo-2.jpg' })
})

it('reports unknown totals for the unknown-progress key', async () => {
  const { token } = (await post(
    `pub_key=pub_test__unknown_progress&source_url=${encodeURIComponent(SOURCE)}`
  ).then((r) => r.json())) as { token: string }
  // Deliberately not run through assertMatchesSpec/poll: the spec's
  // `fileUploadInfoProgressStatus` schema types `total` as `number | null`,
  // so it can't express the `'unknown'` string this pins — the old mock
  // server's, and upload-client's test's, exact expectation for this key.
  // Same shape of gap as base.test.ts's non-image `image_info: null` case.
  const response = (await handle(
    new Request(`https://upload.uploadcare.com/from_url/status/?token=${token}`)
  ))!
  expect(await response.json()).toMatchObject({ total: 'unknown' })
})

it('shortcuts to the file info when duplicate checking is on', async () => {
  const response = await post(
    `pub_key=demopublickey&source_url=${encodeURIComponent(SOURCE)}&check_URL_duplicates=1&save_URL_duplicates=1`
  )
  const parsed = (await response.clone().json()) as Record<string, unknown>
  await assertMatchesSpec({
    method: 'post',
    path: '/from_url/',
    status: 200,
    response,
    body: parsed
  })
  expect(parsed).toMatchObject({
    type: 'file_info',
    original_filename: 'holiday.jpg'
  })
})

it('fails at poll time for a host outside REACHABLE_HOSTS, rather than at POST time', async () => {
  const { token } = (await post(
    `pub_key=demopublickey&source_url=${encodeURIComponent('https://fake-domain-that-will-404.com/a.jpg')}`
  ).then((r) => r.json())) as { token: string }

  expect(await poll(token)).toEqual({
    status: 'error',
    error: 'Host does not exist'
  })
})

it('reports unknown for a token nobody issued', async () => {
  expect(await poll('nope')).toEqual({ status: 'unknown' })
})

it('respects a filename override', async () => {
  const { token } = (await post(
    `pub_key=demopublickey&source_url=${encodeURIComponent(SOURCE)}&filename=renamed.jpg`
  ).then((r) => r.json())) as { token: string }

  let last = await poll(token)
  while (last.status === 'progress') last = await poll(token)
  expect(last).toMatchObject({ original_filename: 'renamed.jpg' })
})
