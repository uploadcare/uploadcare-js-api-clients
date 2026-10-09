import net from 'node:net'
import { afterAll, afterEach, beforeEach, expect, vi } from 'vitest'
import { resetSession } from '@uploadcare/api-emulator'
import { createEmulatorServer } from '@uploadcare/api-emulator/listen'

/**
 * Vitest setup file: every test file starts its own emulator on a free port,
 * and every test gets a fresh session, so a test steers it with
 * `resetSession().use()`/`.on()` and nothing leaks into the next one. The
 * development settings in `_helpers.ts` point at `emulatorOrigin`; the
 * production run talks to the real API instead, and a preset a test applies
 * there changes nothing.
 */
export let emulatorOrigin = ''

/**
 * The emulator has no Pusher, and `uploadFromUrl` opens
 * `wss://ws.pusherapp.com` before every from_url upload. In development the
 * socket is this stand-in: it connects and never delivers a status, as real
 * Pusher does for an emulator token, so polling the emulator settles the upload
 * and nothing leaves the machine.
 */
vi.mock('../src/tools/sockets.node', async (importOriginal) => {
  if (process.env.TEST_ENV === 'production') return importOriginal()
  class SilentPusherSocket {
    private listeners: ((e: { data: string }) => void)[] = []
    constructor() {
      setTimeout(() => {
        const data = JSON.stringify({ event: 'pusher:connection_established' })
        this.listeners.forEach((fn) => fn({ data }))
      })
    }
    addEventListener(type: string, fn: (e: { data: string }) => void): void {
      if (type === 'message') this.listeners.push(fn)
    }
    send(): void {}
    close(): void {}
  }
  return { default: SilentPusherSocket }
})

if (process.env.TEST_ENV !== 'production') {
  const { origin, close } = await createEmulatorServer()
  emulatorOrigin = origin
  afterAll(close)
  beforeEach(() => {
    resetSession()
  })
  refuseRemoteSockets()
}

/**
 * The development suite must not leave the machine: a TCP connection to any
 * host but loopback is refused before DNS, and fails the test that opened it
 * (or, if it opened outside a test, the file).
 */
function refuseRemoteSockets(): void {
  const remote: string[] = []
  const connect = net.Socket.prototype.connect
  net.Socket.prototype.connect = function (
    this: net.Socket,
    ...args: unknown[]
  ) {
    // `net.connect` hands over `[options, callback]` as one array.
    const [first, second] = Array.isArray(args[0]) ? args[0] : args
    const {
      host = 'localhost',
      port,
      path
    } = (
      typeof first === 'object'
        ? first
        : { port: first, host: typeof second === 'string' ? second : undefined }
    ) as {
      host?: string
      port?: unknown
      path?: string
    }
    if (
      path ||
      /^(localhost|127(\.\d+){3}|::1|::ffff:127(\.\d+){3})$/.test(host)
    ) {
      return connect.apply(this, args as Parameters<typeof connect>)
    }
    remote.push(`${host}:${port}`)
    process.nextTick(() =>
      this.destroy(new Error(`refused a socket to ${host}:${port}`))
    )
    return this
  }
  const expectNoRemoteSockets = (): void => {
    expect(remote.splice(0), 'sockets to non-loopback hosts').toEqual([])
  }
  afterEach(expectNoRemoteSockets)
  afterAll(expectNoRemoteSockets)
}
