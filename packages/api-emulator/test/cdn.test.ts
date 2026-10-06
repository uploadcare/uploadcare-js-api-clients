import { beforeEach, expect, it } from 'vitest'
import { handle, resetSession } from '../src/index.js'

const JPEG_1X1 = new Uint8Array([
  0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0xff, 0xd9
])

const upload = async (bytes: Uint8Array = JPEG_1X1, type = 'image/jpeg') => {
  const body = new FormData()
  // `/base/` requires `UPLOADCARE_PUB_KEY` in the body — the brief's original
  // snippet omitted it, which 403s the upload before the CDN is ever reached.
  body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
  body.set('file', new File([bytes], 'a.jpg', { type }))
  const response = await handle(
    new Request('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body
    })
  )
  return ((await response!.json()) as { file: string }).file
}

const createGroup = async (members: string[]) => {
  const body = new FormData()
  body.set('pub_key', 'demopublickey')
  members.forEach((member, index) => body.set(`files[${index}]`, member))
  const response = await handle(
    new Request('https://upload.uploadcare.com/group/', {
      method: 'POST',
      body
    })
  )
  return ((await response!.json()) as { id: string }).id
}

const cdnBytes = async (path: string) =>
  new Uint8Array(
    await (await handle(
      new Request(`https://ucarecdn.com/${path}`)
    ))!.arrayBuffer()
  )

beforeEach(() => resetSession())

it('delivers the bytes that were uploaded, whatever the operations ask for', async () => {
  const uuid = await upload()
  const response = await handle(
    new Request(`https://ucarecdn.com/${uuid}/-/resize/500x/`)
  )
  expect(new Uint8Array(await response!.arrayBuffer())).toEqual(JPEG_1X1)
  expect(response!.headers.get('content-type')).toBe('image/jpeg')
})

it('sandboxes a file served back under the type its uploader claimed', async () => {
  const uuid = await upload(new TextEncoder().encode('<script>'), 'text/html')
  const response = await handle(new Request(`https://ucarecdn.com/${uuid}/`))
  expect(response!.headers.get('content-type')).toBe('text/html')
  expect(response!.headers.get('content-security-policy')).toBe('sandbox')
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
  // `GET /info/` really does match the CDN's `/:uuid/*`; the CDN_ID guard
  // answers `undefined` and `handle()` moves on to the next route. A 502 in a
  // consumer is what regressing it looks like.
  const response = await handle(
    new Request(
      'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=nope'
    )
  )
  expect(response).toBeDefined()
  expect(response!.status).toBe(404)
})

it('resolves a group member given as a CDN url', async () => {
  const uuid = await upload()
  const group = await createGroup([`https://ucarecdn.com/${uuid}/`])
  expect(await cdnBytes(`${group}/nth/0/`)).toEqual(JPEG_1X1)
})

it('picks a group member by nth/, defaulting to the first', async () => {
  const first = await upload(new Uint8Array([1]), 'text/plain')
  const second = await upload(new Uint8Array([2]), 'text/plain')
  const group = await createGroup([first, `${second}/-/resize/x800/`])

  expect(await cdnBytes(`${group}/-/preview/`)).toEqual(new Uint8Array([1]))
  expect(await cdnBytes(`${group}/nth/1/-/preview/`)).toEqual(
    new Uint8Array([2])
  )
  const outOfRange = await handle(
    new Request(`https://ucarecdn.com/${group}/nth/5/-/preview/`)
  )
  expect(outOfRange!.status).toBe(404)
})

it('400s -/json/ for a file that is not an image', async () => {
  const uuid = await upload(new Uint8Array([1]), 'text/plain')
  const response = await handle(
    new Request(`https://ucarecdn.com/${uuid}/-/json/`)
  )
  expect(response!.status).toBe(400)
})
