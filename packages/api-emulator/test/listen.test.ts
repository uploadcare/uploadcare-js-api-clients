import { afterAll, beforeAll, expect, it } from 'vitest'
import { createEmulatorServer } from '../src/listen.js'

let server: Awaited<ReturnType<typeof createEmulatorServer>>

beforeAll(async () => {
  server = await createEmulatorServer()
})
afterAll(() => server.close())

const fileUploadBody = () => {
  const body = new FormData()
  body.set(
    'file',
    new File([new Uint8Array([1, 2, 3])], 'a.bin', {
      type: 'application/octet-stream'
    })
  )
  return body
}

it('answers over HTTP on the port it picked', async () => {
  const response = await fetch(`${server.origin}/base/`, {
    method: 'POST',
    body: fileUploadBody()
  })
  expect(await response.json()).toHaveProperty('file')
})

it('tolerates a missing trailing slash, as the Upload API does', async () => {
  const response = await fetch(
    `${server.origin}/info?pub_key=demopublickey&file_id=nope`
  )
  expect(response.status).toBe(404)
})

it('allows any origin, because every consumer is cross-origin', async () => {
  const response = await fetch(
    `${server.origin}/info/?pub_key=demopublickey&file_id=nope`
  )
  expect(response.headers.get('access-control-allow-origin')).toBe('*')
})

it('answers correctly with the response delay turned off', async () => {
  const fast = await createEmulatorServer({ delayMs: 0 })
  try {
    const response = await fetch(
      `${fast.origin}/info/?pub_key=demopublickey&file_id=nope`
    )
    expect(response.status).toBe(404)
  } finally {
    await fast.close()
  }
})

it('survives a client aborting mid-request and still answers the next one', async () => {
  const controller = new AbortController()
  const aborted = fetch(`${server.origin}/base/`, {
    method: 'POST',
    body: fileUploadBody(),
    signal: controller.signal
  })
  // The listener's own response delay (default 30ms) gives this time to
  // land before the server starts reading the body, which is what puts it
  // on the path this test exists for — see listen.ts's `bodyOf`.
  controller.abort()
  await expect(aborted).rejects.toThrow()

  const response = await fetch(`${server.origin}/base/`, {
    method: 'POST',
    body: fileUploadBody()
  })
  expect(await response.json()).toHaveProperty('file')
})
