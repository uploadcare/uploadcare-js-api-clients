import { beforeEach, expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'
import { assertMatchesSpec, jsonError } from './spec.js'

const JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0xff, 0xd9
])

const upload = async () => {
  const body = new FormData()
  body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  body.set('UPLOADCARE_STORE', 'auto')
  body.set('file', new File([JPEG], 'a.jpg', { type: 'image/jpeg' }))
  const response = await handle(
    new Request('https://upload.uploadcare.com/base/?jsonerrors=1', {
      method: 'POST',
      body
    })
  )
  const parsed = (await response!.clone().json()) as { file: string }
  await assertMatchesSpec({
    method: 'post',
    path: '/base/',
    status: 200,
    response: response!,
    body: parsed
  })
  return parsed.file
}

beforeEach(() => resetSession())

it('answers /base/ with a body the spec accepts', async () => {
  await expect(upload()).resolves.toMatch(/^[0-9a-f-]{36}$/)
})

it('answers /info/ with every field the spec requires', async () => {
  const uuid = await upload()
  const response = await handle(
    new Request(
      `https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=${uuid}`
    )
  )
  await assertMatchesSpec({
    method: 'get',
    path: '/info/',
    status: 200,
    response: response!,
    body: await response!.clone().json()
  })
})

it('uses a status code the spec documents when the file is unknown', async () => {
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=nope'
    )
  )
  // The HTTP status is 200 under `jsonerrors=1`; the status the spec
  // documents is the one inside the envelope.
  await assertMatchesSpec({
    method: 'get',
    path: '/info/',
    status: (await jsonError(response!)).status_code,
    response: response!,
    body: await response!.clone().json()
  })
})

it('answers an unknown file with the spec-declared sentence, jsonerrors=1', async () => {
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=nope'
    )
  )
  const body = (await response!.clone().json()) as {
    error: { content: string }
  }
  expect(await jsonError(response!)).toMatchObject({
    status_code: 404,
    content: 'File is not found.'
  })
  await assertMatchesSpec({
    method: 'get',
    path: '/info/',
    status: 404,
    response: response!,
    body
  })
})

it('answers an unknown file with the bare spec sentence, no jsonerrors', async () => {
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=nope'
    )
  )
  const body = await response!.clone().text()
  expect(response!.status).toBe(404)
  expect(response!.headers.get('content-type')).toMatch(/^text\/plain/)
  expect(body).toBe('File is not found.')
  await assertMatchesSpec({
    method: 'get',
    path: '/info/',
    status: 404,
    response: response!,
    body
  })
})

it('rejects a /base/ upload with no file, jsonerrors=1', async () => {
  const form = new FormData()
  form.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  const response = await handle(
    new Request('https://upload.uploadcare.com/base/?jsonerrors=1', {
      method: 'POST',
      body: form
    })
  )
  const body = (await response!.clone().json()) as {
    error: { content: string }
  }
  expect(await jsonError(response!)).toMatchObject({
    status_code: 400,
    content: 'Request does not contain files.'
  })
  await assertMatchesSpec({
    method: 'post',
    path: '/base/',
    status: 400,
    response: response!,
    body
  })
})

it('rejects an /info/ 200 body missing a required field', async () => {
  const uuid = await upload()
  const response = await handle(
    new Request(
      `https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=${uuid}`
    )
  )
  const body = (await response!.clone().json()) as Record<string, unknown>
  delete body.is_image // one of the spec's 15 required fields

  await expect(
    assertMatchesSpec({
      method: 'get',
      path: '/info/',
      status: 200,
      response: response!,
      body
    })
  ).rejects.toThrow()
})

it('rejects an /info/ 200 body with a required field of the wrong type', async () => {
  const uuid = await upload()
  const response = await handle(
    new Request(
      `https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=${uuid}`
    )
  )
  const body = (await response!.clone().json()) as Record<string, unknown>
  body.is_image = 'yes' // spec says boolean

  await expect(
    assertMatchesSpec({
      method: 'get',
      path: '/info/',
      status: 200,
      response: response!,
      body
    })
  ).rejects.toThrow()
})

it('names the operation, the status, and the failing field when a body fails validation', async () => {
  const uuid = await upload()
  const response = await handle(
    new Request(
      `https://upload.uploadcare.com/info/?jsonerrors=1&pub_key=demopublickey&file_id=${uuid}`
    )
  )
  const body = (await response!.clone().json()) as Record<string, unknown>
  delete body.is_image

  let thrown: unknown
  try {
    await assertMatchesSpec({
      method: 'get',
      path: '/info/',
      status: 200,
      response: response!,
      body
    })
  } catch (error) {
    thrown = error
  }

  expect(thrown).toBeInstanceOf(Error)
  const message = (thrown as Error).message
  expect(message).toContain('GET')
  expect(message).toContain('/info/')
  expect(message).toContain('200')
  expect(message).toContain('is_image')
})

it('rejects a /base/ upload with no file, no jsonerrors', async () => {
  const form = new FormData()
  form.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  const response = await handle(
    new Request('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: form
    })
  )
  const body = await response!.clone().text()
  expect(response!.status).toBe(400)
  expect(response!.headers.get('content-type')).toMatch(/^text\/plain/)
  expect(body).toBe('Request does not contain files.')
  await assertMatchesSpec({
    method: 'post',
    path: '/base/',
    status: 400,
    response: response!,
    body
  })
})
