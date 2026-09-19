import { beforeEach, expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'
import { assertMatchesSpec } from './spec.js'

const PIXEL = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46
])

// Long enough to reach a start-of-frame marker (`imageSize`, unlike PIXEL
// above, decodes this as an actual 1×1 JPEG) — needed for the /info/ round
// trip below, since the spec's `imageInfo` schema (unlike its `video_info`/
// `content_info` siblings) isn't marked nullable, so a non-image's
// `image_info: null` doesn't validate against it. See README.md.
const JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0xff, 0xd9
])

const upload = async (name = 'pixel.jpg', bytes = PIXEL) => {
  const body = new FormData()
  body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  body.set('UPLOADCARE_STORE', 'auto')
  body.set('file', new File([bytes], name, { type: 'image/jpeg' }))
  const response = await handle(
    new Request('https://upload.uploadcare.com/base/', { method: 'POST', body })
  )
  const parsed = (await response!.clone().json()) as { file: string }
  await assertMatchesSpec({
    method: 'post',
    path: '/base/',
    status: 200,
    response: response!,
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
  const { file } = await upload('holiday.jpg', JPEG)
  const response = await handle(
    new Request(
      `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${file}`
    )
  )
  const parsed = await response!.clone().json()
  await assertMatchesSpec({
    method: 'get',
    path: '/info/',
    status: 200,
    response: response!,
    body: parsed
  })
  expect(parsed).toMatchObject({
    uuid: file,
    original_filename: 'holiday.jpg',
    size: JPEG.byteLength,
    mime_type: 'image/jpeg'
  })
})

it('reports image_info: null for a non-image upload', async () => {
  const { file } = await upload('note.txt')
  const response = await handle(
    new Request(
      `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${file}`
    )
  )
  const parsed = (await response!.clone().json()) as {
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

it('refuses an upload with no UPLOADCARE_PUB_KEY', async () => {
  const body = new FormData()
  body.set('file', new File([PIXEL], 'pixel.jpg', { type: 'image/jpeg' }))
  const response = await handle(
    new Request('https://upload.uploadcare.com/base/', { method: 'POST', body })
  )
  expect(response!.status).toBe(403)
  await assertMatchesSpec({
    method: 'post',
    path: '/base/',
    status: 403,
    response: response!,
    body: await response!.clone().text()
  })
})

it('names UPLOADCARE_PUB_KEY, not pub_key, in that error', async () => {
  const body = new FormData()
  body.set('file', new File([PIXEL], 'pixel.jpg', { type: 'image/jpeg' }))
  const response = await handle(
    new Request('https://upload.uploadcare.com/base/?jsonerrors=1', {
      method: 'POST',
      body
    })
  )
  expect(await response!.json()).toMatchObject({
    error: { content: 'UPLOADCARE_PUB_KEY is required.' }
  })
})

it('404s for a file nobody uploaded', async () => {
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=nope'
    )
  )
  expect(response!.status).toBe(404)
  await assertMatchesSpec({
    method: 'get',
    path: '/info/',
    status: response!.status,
    response: response!,
    body: await response!.clone().text()
  })
})
