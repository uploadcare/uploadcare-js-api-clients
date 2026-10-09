import { beforeEach, expect, it } from 'vitest'
import { resetSession } from '../src/index.js'
import {
  call,
  createGroup,
  JPEG_1X1,
  NON_IMAGE_INFO,
  upload
} from './emulator.js'

const groupOf = async (members: string[], options?: { offSpec?: string }) =>
  ((await (await createGroup(members, options)).json()) as { id: string }).id

const cdnBytes = async (path: string) =>
  new Uint8Array(
    await (await call(`https://ucarecdn.com/${path}`)).arrayBuffer()
  )

beforeEach(() => resetSession())

it('delivers the bytes that were uploaded, whatever the operations ask for', async () => {
  const uuid = await upload()
  const response = await call(`https://ucarecdn.com/${uuid}/-/resize/500x/`)
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(JPEG_1X1)
  expect(response.headers.get('content-type')).toBe('image/jpeg')
})

it('sandboxes a file served back under the type its uploader claimed', async () => {
  const uuid = await upload({
    bytes: new TextEncoder().encode('<script>'),
    type: 'text/html'
  })
  const response = await call(`https://ucarecdn.com/${uuid}/`)
  expect(response.headers.get('content-type')).toBe('text/html')
  expect(response.headers.get('content-security-policy')).toBe('sandbox')
})

it('answers -/json/ with the dimensions it read from the bytes', async () => {
  const uuid = await upload()
  const response = await call(`https://ucarecdn.com/${uuid}/-/json/`)
  expect(await response.json()).toMatchObject({
    id: uuid,
    width: 1,
    height: 1,
    format: 'JPEG'
  })
})

it('404s for a file nobody uploaded', async () => {
  const response = await call(
    'https://ucarecdn.com/00000000-0000-4000-8000-000000000000/'
  )
  expect(response.status).toBe(404)
})

it('does not let the CDN route swallow an Upload API GET', async () => {
  // `GET /info/` really does match the CDN's `/:uuid/*`; the CDN_ID guard
  // answers `undefined` and `handle()` moves on to the next route. A 502 in a
  // consumer is what regressing it looks like.
  const response = await call(
    'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=nope'
  )
  expect(response.status).toBe(404)
})

it('resolves a group member given as a CDN url', async () => {
  const uuid = await upload()
  const group = await groupOf([`https://ucarecdn.com/${uuid}/`])
  expect(await cdnBytes(`${group}/nth/0/`)).toEqual(JPEG_1X1)
})

it('picks a group member by nth/, defaulting to the first', async () => {
  const first = await upload({ bytes: new Uint8Array([1]), type: 'text/plain' })
  const second = await upload({
    bytes: new Uint8Array([2]),
    type: 'text/plain'
  })
  const group = await groupOf([first, `${second}/-/resize/x800/`], {
    offSpec: NON_IMAGE_INFO
  })

  expect(await cdnBytes(`${group}/-/preview/`)).toEqual(new Uint8Array([1]))
  expect(await cdnBytes(`${group}/nth/1/-/preview/`)).toEqual(
    new Uint8Array([2])
  )
  const outOfRange = await call(
    `https://ucarecdn.com/${group}/nth/5/-/preview/`
  )
  expect(outOfRange.status).toBe(404)
})

it('400s -/json/ for a file that is not an image', async () => {
  const uuid = await upload({ bytes: new Uint8Array([1]), type: 'text/plain' })
  const response = await call(`https://ucarecdn.com/${uuid}/-/json/`)
  expect(response.status).toBe(400)
})
