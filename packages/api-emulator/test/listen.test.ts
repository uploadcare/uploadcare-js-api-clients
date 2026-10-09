import { once } from 'node:events'
import { connect } from 'node:net'
import { format } from 'node:util'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { resetSession, SESSION_HEADER } from '../src/index.js'
import { createEmulatorServer } from '../src/listen.js'

// No real route throws, which is exactly why the listener needs a net; a
// scenario that throws is how a test reaches it.
const throwOnRoute = () =>
  resetSession().on('GET /throws/', () => {
    throw new Error('route blew up')
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
// body, then hangs up. `expect: 100-continue` is the signal that the listener
// has the request: Node answers it as it hands the request over.
const abortMidBody = async (
  origin: string,
  beforeHangUp?: (origin: string) => Promise<unknown>
) => {
  const { port } = new URL(origin)
  const socket = connect(Number(port), '127.0.0.1')
  await once(socket, 'connect')
  socket.write(
    'POST /base/ HTTP/1.1\r\nhost: 127.0.0.1\r\ncontent-type: text/plain\r\ncontent-length: 1000\r\nexpect: 100-continue\r\n\r\n'
  )
  const [chunk] = await once(socket, 'data')
  expect(String(chunk)).toMatch(/^HTTP\/1\.1 100 Continue/)
  socket.write('partial')
  await beforeHangUp?.(origin)
  socket.destroy()
  await once(socket, 'close')
}

const survivesHangUp = async (
  delayMs: number,
  beforeHangUp?: (origin: string) => Promise<unknown>
) => {
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
  const target = await createEmulatorServer({ delayMs })
  try {
    await abortMidBody(target.origin, beforeHangUp)

    // Answered after its own delay, so after the aborted request's delay ran
    // out and it went on to read the body it will never get.
    const response = await fetch(`${target.origin}/base/`, {
      method: 'POST',
      body: fileUploadBody()
    })
    expect(await response.json()).toHaveProperty('file')
    // An aborted request is ordinary, not a route error to report.
    expect(logged).not.toHaveBeenCalled()
  } finally {
    await target.close()
  }
}

it('survives a client hanging up during the response delay and still answers the next one', async () => {
  // A delay far longer than the hang-up takes, so the hang-up lands inside it.
  await survivesHangUp(200)
})

it('survives a client hanging up while its body is read and still answers the next one', async () => {
  // No delay: the listener goes straight to reading the body. A request sent
  // after the aborted one is answered after its own zero delay, so by then the
  // aborted one is past its delay and waiting on the body.
  await survivesHangUp(0, (origin) =>
    fetch(`${origin}/info/?pub_key=demopublickey&file_id=nope`)
  )
})

it('answers 500 when a route throws, instead of crashing the process', async () => {
  throwOnRoute()
  const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
  const response = await fetch(`${server.origin}/throws/`)
  expect(response.status).toBe(500)
  expect(response.headers.get('access-control-allow-origin')).toBe('*')
  // The error stays in the server log; the body is fixed, so nothing thrown
  // inside the emulator reaches the client.
  expect(await response.text()).toBe('emulator error')
  expect(logged.mock.calls.map((call) => format(...call))).toEqual([
    expect.stringMatching(/GET \/throws\/.*route blew up/s)
  ])
})

it('keeps serving after a route throws', async () => {
  throwOnRoute()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  await fetch(`${server.origin}/throws/`)

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

it('answers 502 for a path no route handles, naming it only in the log', async () => {
  const logged = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const response = await fetch(`${server.origin}/no-such-route/`)
  expect(response.status).toBe(502)
  expect(response.headers.get('access-control-allow-origin')).toBe('*')
  expect(response.headers.get('content-type')).toContain('text/plain')
  expect(await response.text()).toBe('not handled by the emulator')
  expect(logged.mock.calls.map((call) => format(...call))).toEqual([
    expect.stringContaining('GET /no-such-route/')
  ])
})

it('logs what it received to the session’s requests', async () => {
  const session = resetSession('listen-requests')
  await fetch(`${server.origin}/base/`, {
    method: 'POST',
    headers: { [SESSION_HEADER]: 'listen-requests' },
    body: fileUploadBody()
  })

  expect(session.requests.map((request) => request.method)).toEqual(['POST'])
  expect(
    ((await session.requests[0].formData()).get('file') as File).name
  ).toBe('a.bin')
})
