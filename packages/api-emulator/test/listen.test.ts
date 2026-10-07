import { once } from 'node:events'
import { connect } from 'node:net'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import { SESSION_HEADER } from '../src/index.js'
import type * as Emulator from '../src/index.js'
import { createEmulatorServer, remoteSession } from '../src/listen.js'

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
  // The error stays in the server log; the body is fixed, so nothing thrown
  // inside the emulator reaches the client.
  expect(await response.text()).toBe('emulator error')
  expect(logged).toHaveBeenCalledWith(
    '[api-emulator] %s %s threw:',
    'GET',
    '/throws/',
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

it('answers 502 for a path no route handles, naming it only in the log', async () => {
  const logged = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const response = await fetch(`${server.origin}/no-such-route/`)
  expect(response.status).toBe(502)
  expect(response.headers.get('access-control-allow-origin')).toBe('*')
  expect(response.headers.get('content-type')).toContain('text/plain')
  expect(await response.text()).toBe('not handled by the emulator')
  expect(logged).toHaveBeenCalledExactlyOnceWith(
    '[api-emulator] not handled by the emulator: %s %s',
    'GET',
    '/no-such-route/'
  )
  logged.mockRestore()
})

describe('the control endpoint', () => {
  const info = (session?: string) =>
    fetch(`${server.origin}/info/?pub_key=demopublickey&file_id=nope`, {
      headers: session === undefined ? {} : { [SESSION_HEADER]: session }
    })

  afterEach(() => remoteSession(server.origin).clear())

  it('applies a preset by name and args, as session.use() does', async () => {
    await remoteSession(server.origin).use('throttle', {
      match: 'POST /base/'
    })
    const throttled = await fetch(`${server.origin}/base/?jsonerrors=1`, {
      method: 'POST',
      body: fileUploadBody()
    })
    expect(throttled.headers.get('retry-after')).toBe('1')
    expect(await throttled.json()).toMatchObject({
      error: { status_code: 429 }
    })
    const response = await fetch(`${server.origin}/base/`, {
      method: 'POST',
      body: fileUploadBody()
    })
    expect(await response.json()).toHaveProperty('file')
  })

  it('answers a declared response: status, JSON body and headers, `times` times', async () => {
    await remoteSession(server.origin).on(
      'GET /info/',
      { status: 503, body: { down: true }, headers: { 'x-why': 'test' } },
      { times: 1 }
    )
    const declared = await info()
    expect(declared.status).toBe(503)
    expect(declared.headers.get('x-why')).toBe('test')
    expect(await declared.json()).toEqual({ down: true })
    expect((await info()).status).toBe(404)
  })

  it('sends a string body as text, after `delay` milliseconds', async () => {
    await remoteSession(server.origin).on('GET /info/', {
      body: 'plain',
      delay: 150
    })
    const started = Date.now()
    const response = await info()
    expect(await response.text()).toBe('plain')
    expect(Date.now() - started).toBeGreaterThanOrEqual(150)
  })

  it('is scoped by the session header, and clear() empties that session alone', async () => {
    await remoteSession(server.origin, 'remote-a').on('GET /info/', {
      status: 418
    })
    await remoteSession(server.origin).on('GET /info/', { status: 410 })
    expect((await info('remote-a')).status).toBe(418)
    expect((await info()).status).toBe(410)

    await remoteSession(server.origin, 'remote-a').clear()
    expect((await info('remote-a')).status).toBe(404)
    expect((await info()).status).toBe(410)
  })

  it('clears preset settings too', async () => {
    await remoteSession(server.origin).use('signedUploads')
    await remoteSession(server.origin).clear()
    const response = await fetch(`${server.origin}/base/`, {
      method: 'POST',
      body: fileUploadBody()
    })
    expect(await response.json()).toHaveProperty('file')
  })

  it.each([
    [{ preset: 'nope' }, /No such preset/],
    [{ preset: 'throttle', args: { match: 'POST /base/', times: 0 } }, /times/],
    [{ match: 'nope' }, /METHOD \/path/],
    [{ match: 'GET /info/', status: 99 }, /status/],
    [{ match: 'GET /info/', headers: { a: 1 } }, /headers/],
    [{ match: 'GET /info/', delay: -1 }, /delay/],
    [{ match: 'GET /info/', status: 204, body: 'x' }, /204/]
  ])('refuses %j with a 400 naming the problem', async (body, message) => {
    const response = await fetch(`${server.origin}/__emulator/scenarios`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
    expect(response.status).toBe(400)
    expect(await response.text()).toMatch(message)
  })

  it('refuses a body that is not a JSON object', async () => {
    const response = await fetch(`${server.origin}/__emulator/scenarios`, {
      method: 'POST',
      body: 'nope'
    })
    expect(response.status).toBe(400)
  })

  it("rejects the helper call with the endpoint's message", async () => {
    await expect(
      remoteSession(server.origin).use('nope' as never, undefined as never)
    ).rejects.toThrow(/No such preset/)
  })
})
