import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { setupEmulator } from '../../src/node.js'
import { sendNode, startLocalServer, uploadForm } from './helpers.js'

const realFetch = globalThis.fetch
const emulator = setupEmulator({ cdnHosts: ['cdn.example.com'] })
let local: Awaited<ReturnType<typeof startLocalServer>>

beforeAll(async () => {
  local = await startLocalServer()
})
beforeEach(() => emulator.reset())
afterAll(async () => {
  await emulator.stop()
  await local.close()
})

const upload = async (bytes: Uint8Array) => {
  const response = await fetch('https://upload.uploadcare.com/base/', {
    method: 'POST',
    body: uploadForm(new Blob([bytes]))
  })
  expect(response.status).toBe(200)
  return ((await response.json()) as { file: string }).file
}

it('serves an uploaded file back from every CDN host, over fetch', async () => {
  const bytes = new Uint8Array([1, 2, 3, 4])
  const uuid = await upload(bytes)

  for (const host of [
    'ucarecdn.com',
    'abcdef1234.ucarecd.net',
    'cdn.example.com'
  ]) {
    const response = await fetch(`https://${host}/${uuid}/`)
    expect([host, new Uint8Array(await response.arrayBuffer())]).toEqual([
      host,
      bytes
    ])
  }
})

it('answers node:https too, from the same state', async () => {
  const uuid = await upload(new Uint8Array([1]))

  const info = await sendNode(
    'GET',
    `https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=${uuid}`
  )

  expect(info).toMatchObject({ status: 200 })
  expect(JSON.parse((info as { body: string }).body)).toMatchObject({ uuid })
})

it('fails an Uploadcare path it has no route for, naming it', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  await expect(fetch('https://upload.uploadcare.com/nope/')).rejects.toThrow(
    TypeError
  )
  expect(
    await sendNode('POST', 'https://ucarecdn.com/not-a-uuid/', 'x')
  ).toHaveProperty('error')

  expect(warn.mock.calls.map(([message]) => message)).toEqual([
    expect.stringContaining('GET https://upload.uploadcare.com/nope/'),
    expect.stringContaining('POST https://ucarecdn.com/not-a-uuid/')
  ])
})

// A DOM test environment's fetch (happy-dom) or XHR (jsdom) goes out over
// node:http(s) and enforces CORS: it preflights, then checks the answer.
it('answers a CORS preflight and lets any origin read its answers', async () => {
  const info =
    'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=x'

  expect(await sendNode('OPTIONS', info)).toMatchObject({ status: 204 })
  expect((await fetch(info)).headers.get('access-control-allow-origin')).toBe(
    '*'
  )
})

it('refuses a foreign origin by default, naming it, localhost included', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const url = `${local.origin}/`

  await expect(fetch(url)).rejects.toThrow(TypeError)
  expect(await sendNode('GET', url)).toHaveProperty('error')

  expect(error.mock.calls.map(([message]) => message)).toEqual([
    expect.stringContaining(url),
    expect.stringContaining(url)
  ])
})

it('fails a dropped connection as a network error', async () => {
  const session = await emulator.reset()
  session.on('GET /info/', () => Response.error())
  const info =
    'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=x'

  await expect(fetch(info)).rejects.toThrow(TypeError)
  expect(await sendNode('GET', info)).toHaveProperty('error')
})

it('starts each test from a fresh session', async () => {
  const uuid = await upload(new Uint8Array([1]))
  expect((await fetch(`https://ucarecdn.com/${uuid}/`)).status).toBe(200)

  await emulator.reset()

  expect((await fetch(`https://ucarecdn.com/${uuid}/`)).status).toBe(404)
})

it('answers with the scenarios registered on the handle reset() returns, and logs to it', async () => {
  const session = await emulator.reset()
  session.on('GET /info/', () => new Response('scenario'), { times: 2 })
  const info =
    'https://upload.uploadcare.com/info/?pub_key=demopublickey&file_id=x'

  expect(await (await fetch(info)).text()).toBe('scenario')
  expect(await sendNode('GET', info)).toMatchObject({ body: 'scenario' })
  expect(session.requests.map((request) => request.url)).toEqual([info, info])
})

it('restores the real fetch on stop(), and starts again on reset()', async () => {
  expect(globalThis.fetch).not.toBe(realFetch)

  await emulator.stop()
  expect(globalThis.fetch).toBe(realFetch)
  expect(await (await fetch(`${local.origin}/`)).text()).toBe('local')

  await emulator.reset()
  expect(globalThis.fetch).not.toBe(realFetch)
})
