import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import { resetSession } from '../src/index.js'
import { createEmulatorServer } from '../src/listen.js'
import { call, JPEG_1X1 } from './emulator.js'
import { assertMatchesSpec } from './spec.js'

const BIG = 11 * 1024 * 1024

const startForm = (fields: Record<string, string>) => {
  const form = new FormData()
  form.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  return form
}

const start = (fields: Record<string, string>) =>
  call('https://upload.uploadcare.com/multipart/start/', {
    method: 'POST',
    body: startForm(fields)
  })

const complete = (uuid: string) => {
  const body = new FormData()
  body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  body.set('uuid', uuid)
  return call('https://upload.uploadcare.com/multipart/complete/', {
    method: 'POST',
    body
  })
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
    'File size can not be less than 10000000 bytes. Please use direct upload instead of multipart.'
  )
})

it.each(['abc', '15000000.5'])('refuses a size of %s', async (size) => {
  const response = await start({
    filename: 'a.jpg',
    size,
    content_type: 'image/jpeg'
  })
  expect(response.status).toBe(400)
  expect(await response.text()).toBe('size should be integer.')
})

it('refuses a size too big to cut into parts', async () => {
  const response = await start({
    filename: 'a.jpg',
    size: '1000000000000000',
    content_type: 'image/jpeg'
  })
  expect(response.status).toBe(400)
  expect(await response.text()).toBe('File size exceeds project limit.')
})

it('refuses an upload with no content_type', async () => {
  const response = await start({ filename: 'a.jpg', size: String(BIG) })
  expect(response.status).toBe(400)
  expect(await response.text()).toBe('content_type is required.')
})

it('refuses an upload with no UPLOADCARE_PUB_KEY', async () => {
  const form = new FormData()
  form.set('filename', 'a.jpg')
  form.set('size', String(BIG))
  form.set('content_type', 'image/jpeg')
  const response = await call(
    'https://upload.uploadcare.com/multipart/start/',
    {
      method: 'POST',
      body: form
    }
  )
  expect(response.status).toBe(403)
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
  await assertMatchesSpec(response, {
    method: 'post',
    path: '/multipart/start/'
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

  // Distinct bytes per part, PUT out of order: every part's bytes must land
  // in the completed file by partNumber, not by arrival.
  const chunks = [JPEG_1X1, new Uint8Array([2, 2, 2]), new Uint8Array([3])]
  for (const index of [2, 0, 1]) {
    const response = await call(parts[index], {
      method: 'PUT',
      body: chunks[index]
    })
    expect(response.status).toBe(200)
  }
  const assembled = new Uint8Array([...JPEG_1X1, 2, 2, 2, 3])

  const completed = await complete(uuid)
  const body = await completed.clone().json()
  expect(body).toMatchObject({
    uuid,
    original_filename: 'big.jpg',
    size: assembled.byteLength
  })
  await assertMatchesSpec(completed, {
    method: 'post',
    path: '/multipart/complete/'
  })

  // Stored like any other file: /info/ can answer about it afterwards.
  const info = await call(
    `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${uuid}`
  )
  expect(info.status).toBe(200)
  expect(await info.json()).toMatchObject({
    uuid,
    original_filename: 'big.jpg'
  })
  const delivered = await call(`https://ucarecdn.com/${uuid}/`)
  expect(new Uint8Array(await delivered.arrayBuffer())).toEqual(assembled)
})

it('refuses to complete a uuid no /multipart/start/ ever issued', async () => {
  const response = await complete('00000000-0000-4000-8000-000000000000')
  expect(response.status).toBe(404)
})

it('fails a part PUT that leaks an Authorization header as a network error', async () => {
  const { uuid, parts } = (await (
    await start({
      filename: 'big.jpg',
      size: String(BIG),
      content_type: 'image/jpeg'
    })
  ).json()) as { parts: string[]; uuid: string }
  expect(uuid).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/
  )

  const response = await call(parts[0], {
    method: 'PUT',
    headers: { authorization: 'Bearer leaked' },
    body: new Uint8Array([1])
  })
  expect(response.type).toBe('error')
})

let server: Awaited<ReturnType<typeof createEmulatorServer>>
beforeAll(async () => {
  server = await createEmulatorServer()
})
afterAll(() => server.close())

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

it('refuses to complete an upload missing a part, ignoring a stray partNumber', async () => {
  const { uuid, parts } = (await (
    await start({
      filename: 'big.jpg',
      size: String(BIG),
      content_type: 'image/jpeg'
    })
  ).json()) as { parts: string[]; uuid: string }
  expect(parts).toHaveLength(3)

  const stray = await call(
    `https://upload.uploadcare.com/multipart/upload/${uuid}/original?partNumber=10`,
    { method: 'PUT', body: new Uint8Array([1]) }
  )
  expect(stray.status).toBe(200)

  // The out-of-range write lands nowhere, so none of the three parts arrived.
  const completed = await complete(uuid)
  expect(completed.status).toBe(400)
  expect(await completed.text()).toBe(
    'File size mismatch. Not all parts uploaded?'
  )
})
