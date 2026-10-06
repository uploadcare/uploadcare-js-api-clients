import { once } from 'node:events'
import { connect } from 'node:net'
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
  expect(response.headers.get('access-control-expose-headers')).toBe('*')
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

// A raw socket, because `fetch` + `abort()` tears the request down before a
// single byte reaches the server. This one sends the headers and part of the
// body, then hangs up — during the listener's 30ms delay, or after it, while
// `bodyOf` is reading.
const abortMidBody = async (hangUpAfterMs: number) => {
  const { port } = new URL(server.origin)
  const socket = connect(Number(port), '127.0.0.1')
  await once(socket, 'connect')
  socket.write(
    'POST /base/ HTTP/1.1\r\nhost: 127.0.0.1\r\ncontent-type: text/plain\r\ncontent-length: 1000\r\n\r\npartial'
  )
  await new Promise((resolve) => setTimeout(resolve, hangUpAfterMs))
  socket.destroy()
}

it.each([10, 60])(
  'survives a client hanging up mid-body after %sms and still answers the next one',
  async (hangUpAfterMs) => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    await abortMidBody(hangUpAfterMs)
    await new Promise((resolve) => setTimeout(resolve, 50))

    const response = await fetch(`${server.origin}/base/`, {
      method: 'POST',
      body: fileUploadBody()
    })
    expect(await response.json()).toHaveProperty('file')
    // An aborted request is ordinary, not a route error to report.
    expect(logged).not.toHaveBeenCalled()
    logged.mockRestore()
  }
)

it('answers 500 when a route throws, instead of crashing the process', async () => {
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
  const response = await fetch(`${server.origin}/throws/`)
  expect(response.status).toBe(500)
  expect(response.headers.get('access-control-allow-origin')).toBe('*')
  expect(await response.text()).toContain('route blew up')
  expect(logged).toHaveBeenCalledWith(
    '[api-emulator] GET /throws/ threw:',
    expect.any(Error)
  )
  logged.mockRestore()

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

it('answers 502, naming the request, for a path no route handles', async () => {
  const logged = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const response = await fetch(`${server.origin}/no-such-route/`)
  expect(response.status).toBe(502)
  expect(response.headers.get('access-control-allow-origin')).toBe('*')
  expect(response.headers.get('content-type')).toContain('text/plain')
  expect(await response.text()).toBe(
    'not handled by the emulator: GET /no-such-route/'
  )
  expect(logged).toHaveBeenCalledOnce()
  logged.mockRestore()
})
