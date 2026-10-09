import { vi, expect, it } from 'vitest'

// A stand-in for `ws`: `send` throws unless OPEN, and a closed socket can
// still deliver a frame it had already received, like `ws` in CLOSING.
const sockets: FakeSocket[] = []
class FakeSocket {
  readyState = 0
  sent: string[] = []
  listeners: Record<string, ((e: unknown) => void)[]> = {}
  constructor() {
    sockets.push(this)
  }
  addEventListener(type: string, fn: (e: unknown) => void): void {
    ;(this.listeners[type] ??= []).push(fn)
  }
  deliver(event: string): void {
    this.listeners.message?.forEach((fn) =>
      fn({ data: JSON.stringify({ event }) })
    )
  }
  fail(): void {
    this.listeners.error?.forEach((fn) => fn({ message: 'closed early' }))
  }
  open(): void {
    this.readyState = 1
    this.deliver('pusher:connection_established')
  }
  send(str: string): void {
    if (this.readyState !== 1) throw new Error('WebSocket is not open')
    this.sent.push(str)
  }
  close(): void {
    this.readyState = 2
  }
}
vi.mock('../../src/tools/sockets.node', () => ({ default: FakeSocket }))

const { default: Pusher } = await import('../../src/uploadFile/pusher')

it('ignores events from a socket it already closed', () => {
  const pusher = new Pusher('key', 0)
  const onError = vi.fn()
  pusher.onError(onError)
  pusher.subscribe('a', () => undefined)
  pusher.unsubscribe('a')
  pusher.subscribe('b', () => undefined)
  const [stale, current] = sockets

  expect(() => stale.open()).not.toThrow()
  expect(current.sent).toEqual([])
  stale.fail()
  expect(onError).not.toHaveBeenCalled()

  current.open()
  expect(current.sent.map((s) => JSON.parse(s).data.channel)).toEqual([
    'task-status-b'
  ])
  current.fail()
  expect(onError).toHaveBeenCalledOnce()
})
