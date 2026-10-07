import { beforeEach, expect, it } from 'vitest'
import { resetSession } from '../src/index.js'
import { call, JPEG_1X1, uploadFile } from './emulator.js'
import { assertMatchesSpec } from './spec.js'

// A JPEG signature with no frame header, so `imageSize` can't read a size out
// of it.
const PIXEL = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46
])

const upload = async (name = 'pixel.jpg', bytes = PIXEL) => {
  const response = await uploadFile({
    name,
    bytes,
    fields: { UPLOADCARE_STORE: 'auto' }
  })
  const parsed = (await response.clone().json()) as { file: string }
  await assertMatchesSpec({
    method: 'post',
    path: '/base/',
    status: 200,
    response,
    body: parsed
  })
  return parsed
}

beforeEach(() => resetSession())

it('hands back a new id for every upload', async () => {
  const first = await upload()
  const second = await upload()
  expect(first.file).not.toEqual(second.file)
})

it('describes the file that was actually uploaded', async () => {
  const { file } = await upload('holiday.jpg', JPEG_1X1)
  const response = await call(
    `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${file}`
  )
  const parsed = await response.clone().json()
  await assertMatchesSpec({
    method: 'get',
    path: '/info/',
    status: 200,
    response,
    body: parsed
  })
  expect(parsed).toMatchObject({
    uuid: file,
    original_filename: 'holiday.jpg',
    size: JPEG_1X1.byteLength,
    mime_type: 'image/jpeg'
  })
})

it('reports image_info: null for a non-image upload', async () => {
  const { file } = await upload('note.txt')
  const response = await call(
    `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${file}`
  )
  const parsed = (await response.clone().json()) as {
    is_image: boolean
    image_info: unknown
  }
  // Deliberately not run through assertMatchesSpec: components.schemas.fileUploadInfo
  // requires `image_info` and doesn't mark it nullable (unlike its video_info/
  // content_info siblings — see README.md), so the spec can't express this response,
  // even though it's exactly what the real API returns for a non-image. This test
  // asserts the emulator's behaviour directly instead.
  expect(parsed.is_image).toBe(false)
  expect(parsed.image_info).toBeNull()
})

const noPubKey = (query = '') => {
  const body = new FormData()
  body.set('file', new File([PIXEL], 'pixel.jpg', { type: 'image/jpeg' }))
  return call(`https://upload.uploadcare.com/base/${query}`, {
    method: 'POST',
    body
  })
}

it('refuses an upload with no UPLOADCARE_PUB_KEY', async () => {
  const response = await noPubKey()
  expect(response.status).toBe(403)
  await assertMatchesSpec({
    method: 'post',
    path: '/base/',
    status: 403,
    response,
    body: await response.clone().text()
  })
})

it('names UPLOADCARE_PUB_KEY, not pub_key, in that error', async () => {
  const response = await noPubKey('?jsonerrors=1')
  expect(await response.json()).toMatchObject({
    error: { content: 'UPLOADCARE_PUB_KEY is required.' }
  })
})

it('400s for /info/ without a file_id', async () => {
  const response = await call(
    'https://upload.uploadcare.com/info/?pub_key=demopublickey'
  )
  expect(response.status).toBe(400)
  await assertMatchesSpec({
    method: 'get',
    path: '/info/',
    status: response.status,
    response,
    body: await response.clone().text()
  })
  expect(await response.clone().text()).toContain('file_id is required.')
})

it('404s for a file nobody uploaded', async () => {
  const response = await call(
    'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=nope'
  )
  expect(response.status).toBe(404)
  await assertMatchesSpec({
    method: 'get',
    path: '/info/',
    status: response.status,
    response,
    body: await response.clone().text()
  })
})
