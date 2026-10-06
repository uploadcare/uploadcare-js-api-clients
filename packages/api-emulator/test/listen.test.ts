import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import type * as Emulator from '../src/index.js'
import { createEmulatorServer } from '../src/listen.js'

// A route that throws, so the listener's own error path can be reached; no
// real route is supposed to, which is exactly why it needs a net.
vi.mock('../src/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof Emulator>()
  return {
    ...actual,
    handle: (request: Request) =>
      new URL(request.url).pathname === '/throws/'
        ? Promise.reject(new Error('route blew up'))
        : actual.handle(request)
  }
})

let server: Awaited<ReturnType<typeof createEmulatorServer>>

beforeAll(async () => {
  server = await createEmulatorServer()
})
afterAll(() => server.close())

const fileUploadBody = () => {
  const body = new FormData()
  body.set('UPLOADCARE_PUB_KEY', 'demopublickey')
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

it('answers a CORS preflight, including the session header', async () => {
  // A browser sends this before any request carrying a custom header — which
  // `SESSION_HEADER` is, and which README.md tells consumers to set on every
  // request. Without it the real request is never sent at all.
  const response = await fetch(`${server.origin}/base/`, {
    method: 'OPTIONS',
    headers: {
      origin: 'https://example.test',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'x-uploadcare-emulator-session'
    }
  })
  expect(response.status).toBe(204)
  expect(response.headers.get('access-control-allow-origin')).toBe('*')
  expect(response.headers.get('access-control-allow-methods')).toContain('POST')
  expect(response.headers.get('access-control-allow-headers')).toContain(
    'x-uploadcare-emulator-session'
  )
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

it('answers 500 when a route throws, instead of crashing the process', async () => {
  const response = await fetch(`${server.origin}/throws/`)
  expect(response.status).toBe(500)
  expect(response.headers.get('access-control-allow-origin')).toBe('*')
  expect(await response.text()).toContain('route blew up')

  const next = await fetch(
    `${server.origin}/info/?pub_key=demopublickey&file_id=nope`
  )
  expect(next.status).toBe(404)
})

it('can stop holding the process open, for a caller with no teardown hook', async () => {
  const detached = await createEmulatorServer({ delayMs: 0 })
  try {
    detached.unref()
    // Still serves while something else keeps the process alive.
    const response = await fetch(
      `${detached.origin}/info/?pub_key=demopublickey&file_id=nope`
    )
    expect(response.status).toBe(404)
  } finally {
    await detached.close()
  }
})
