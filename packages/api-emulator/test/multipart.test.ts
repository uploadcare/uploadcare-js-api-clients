import { beforeAll, beforeEach, expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'
import { createEmulatorServer } from '../src/listen.js'
import { assertMatchesSpec } from './spec.js'

// Long enough to decode as a real 1×1 JPEG (see base.test.ts / group.test.ts)
// — needed so `image_info` comes back non-null, since the spec's `imageInfo`
// schema isn't nullable.
const JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0xff, 0xd9
])

const BIG = 11 * 1024 * 1024

const startForm = (fields: Record<string, string>) => {
  const form = new FormData()
  form.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  return form
}

const start = async (fields: Record<string, string>) =>
  (await handle(
    new Request('https://upload.uploadcare.com/multipart/start/', {
      method: 'POST',
      body: startForm(fields)
    })
  ))!

const complete = async (uuid: string) => {
  const body = new FormData()
  body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  body.set('uuid', uuid)
  return (await handle(
    new Request('https://upload.uploadcare.com/multipart/complete/', {
      method: 'POST',
      body
    })
  ))!
}

beforeEach(() => resetSession())

it('refuses a file small enough for a direct upload', async () => {
  const response = await start({
    filename: 'a.jpg',
    size: '1024',
    content_type: 'image/jpeg'
  })
  expect(response.status).toBe(400)
  expect(await response.clone().text()).toBe(
    'File size can not be less than 10485760 bytes. Please use direct upload instead of multipart.'
  )
})

it('refuses an upload with no UPLOADCARE_PUB_KEY', async () => {
  const form = new FormData()
  form.set('filename', 'a.jpg')
  form.set('size', String(BIG))
  form.set('content_type', 'image/jpeg')
  const response = await handle(
    new Request('https://upload.uploadcare.com/multipart/start/', {
      method: 'POST',
      body: form
    })
  )
  expect(response!.status).toBe(403)
})

it('hands out one part url per 5MB chunk, on its own origin', async () => {
  const response = await start({
    filename: 'big.jpg',
    size: String(BIG),
    content_type: 'image/jpeg'
  })
  const body = (await response.clone().json()) as {
    parts: string[]
    uuid: string
  }
  await assertMatchesSpec({
    method: 'post',
    path: '/multipart/start/',
    status: 200,
    response,
    body
  })

  expect(body.parts).toHaveLength(3)
  for (const part of body.parts)
    expect(part).toContain(
      `https://upload.uploadcare.com/multipart/upload/${body.uuid}/`
    )
})

it('describes the finished file once the upload is completed', async () => {
  const { uuid, parts } = (await (
    await start({
      filename: 'big.jpg',
      size: String(BIG),
      content_type: 'image/jpeg'
    })
  ).json()) as { parts: string[]; uuid: string }

  for (const [index, part] of parts.entries()) {
    // The real file is only ever this one small JPEG; what matters for the
    // emulator's contract is that every part's bytes land in the completed
    // file in order.
    const chunk = index === 0 ? JPEG : new Uint8Array()
    const response = await handle(
      new Request(part, { method: 'PUT', body: chunk })
    )
    expect(response!.status).toBe(200)
  }

  const completed = await complete(uuid)
  const body = await completed.clone().json()
  expect(body).toMatchObject({ uuid, original_filename: 'big.jpg' })
  await assertMatchesSpec({
    method: 'post',
    path: '/multipart/complete/',
    status: 200,
    response: completed,
    body
  })

  // Stored like any other file: /info/ can answer about it afterwards.
  const info = await handle(
    new Request(
      `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${uuid}`
    )
  )
  expect(info!.status).toBe(200)
  expect(await info!.json()).toMatchObject({
    uuid,
    original_filename: 'big.jpg'
  })
})

it('refuses to complete a uuid no /multipart/start/ ever issued', async () => {
  const response = await complete('00000000-0000-4000-8000-000000000000')
  expect(response.status).toBe(400)
})

it('marks a part PUT that leaks an Authorization header, instead of answering it plainly', async () => {
  const { uuid, parts } = (await (
    await start({
      filename: 'big.jpg',
      size: String(BIG),
      content_type: 'image/jpeg'
    })
  ).json()) as { parts: string[]; uuid: string }
  expect(uuid).toBeTruthy()

  const response = await handle(
    new Request(parts[0], {
      method: 'PUT',
      headers: { authorization: 'Bearer leaked' },
      body: new Uint8Array([1])
    })
  )
  // `handle()` never touches a socket — see listen.test.ts for the part that
  // actually drops the connection. Here it's only the marker that must be
  // set.
  expect(response!.headers.get('x-emulator-drop-connection')).toBe('1')
})

let server: Awaited<ReturnType<typeof createEmulatorServer>>
beforeAll(async () => {
  server = await createEmulatorServer()
})

it('drops the connection on a part PUT that carries an Authorization header', async () => {
  const startResponse = await fetch(`${server.origin}/multipart/start/`, {
    method: 'POST',
    body: startForm({
      filename: 'big.jpg',
      size: String(BIG),
      content_type: 'image/jpeg'
    })
  })
  const { parts } = (await startResponse.json()) as { parts: string[] }

  await expect(
    fetch(parts[0], {
      method: 'PUT',
      headers: { authorization: 'Bearer leaked' },
      body: new Uint8Array([1])
    })
  ).rejects.toThrow()
})
