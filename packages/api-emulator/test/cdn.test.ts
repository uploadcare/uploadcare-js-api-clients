import { beforeEach, expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'

const JPEG_1X1 = new Uint8Array([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0xff, 0xd9
])

const upload = async () => {
  const body = new FormData()
  // `/base/` requires `UPLOADCARE_PUB_KEY` in the body — the brief's original
  // snippet omitted it, which 403s the upload before the CDN is ever reached.
  body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  body.set('file', new File([JPEG_1X1], 'a.jpg', { type: 'image/jpeg' }))
  const response = await handle(
    new Request('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body
    })
  )
  return ((await response!.json()) as { file: string }).file
}

beforeEach(() => resetSession())

it('delivers the bytes that were uploaded, whatever the operations ask for', async () => {
  const uuid = await upload()
  const response = await handle(
    new Request(`https://ucarecdn.com/${uuid}/-/resize/500x/`)
  )
  expect(new Uint8Array(await response!.arrayBuffer())).toEqual(JPEG_1X1)
  expect(response!.headers.get('content-type')).toBe('image/jpeg')
})

it('answers -/json/ with the dimensions it read from the bytes', async () => {
  const uuid = await upload()
  const response = await handle(
    new Request(`https://ucarecdn.com/${uuid}/-/json/`)
  )
  expect(await response!.json()).toMatchObject({
    id: uuid,
    width: 1,
    height: 1,
    format: 'JPEG'
  })
})

it('404s for a file nobody uploaded', async () => {
  const response = await handle(
    new Request('https://ucarecdn.com/00000000-0000-4000-8000-000000000000/')
  )
  expect(response!.status).toBe(404)
})

it('does not let the CDN route swallow an Upload API GET', async () => {
  // `router.ts`'s `match` returns as soon as it reaches a `*` segment, so
  // `GET /info/` really does match the CDN's `/:uuid/*` — and the CDN_ID guard
  // then returns `undefined`, which `handle()` reads as "handled, no response"
  // rather than "try the next route". Import order in `src/index.ts` is the
  // only thing keeping every Upload API GET off that path, and nothing else
  // pins it. A 502 in a consumer is what regressing it looks like.
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=nope'
    )
  )
  expect(response).toBeDefined()
  expect(response!.status).toBe(404)
})
