import { afterAll, beforeEach, vi } from 'vitest'
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
}
