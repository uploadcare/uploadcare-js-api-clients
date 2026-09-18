import { beforeEach, expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'
import { assertMatchesSpec } from './spec.js'

const PIXEL = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46
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
  const { file } = await upload('holiday.jpg')
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
    size: PIXEL.byteLength,
    mime_type: 'image/jpeg'
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
